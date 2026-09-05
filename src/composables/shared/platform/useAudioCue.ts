import { readonly, ref, type InjectionKey } from 'vue'

// 0 秒到達の通知音。ジムの環境音でも気づけるよう、短い矩形波を 3 連で鳴らす。
// 正弦波は倍音を持たず単一の周波数成分しかないため、同じ帯域の騒音と重なると輪郭ごと埋もれる
const BEEP_TYPE = 'square'
// C6。小型スピーカーが十分な音量を出せて、人の聴覚の感度も高い帯域に置く
const BEEP_FREQUENCY_HZ = 1046.5
const BEEP_DURATION_SEC = 0.08
const BEEP_GAP_SEC = 0.07
const BEEP_COUNT = 3
// 矩形波は倍音のぶん同じ値でも正弦波より大きく聞こえるため、振幅は低めに取る
const BEEP_PEAK_GAIN = 0.16
// 音量を矩形に切り替えるとクリックノイズが乗るため、両端をフェードさせる。
// 立ち上がりは短くして音の芯を残し、終端はノイズが出ない程度に長く取る
const BEEP_ATTACK_SEC = 0.004
const BEEP_RELEASE_SEC = 0.008
// 3 連ビープを繰り返す間隔。止めるまで鳴り続ける（spec「インターバルタイマー」）
const BEEP_REPEAT_MS = 2000

type AudioCueOscillator = {
  type: OscillatorType
  readonly frequency: { value: number }
  connect(destination: unknown): void
  start(when: number): void
  stop(when: number): void
}

type AudioCueGain = {
  readonly gain: {
    setValueAtTime(value: number, startTime: number): void
    linearRampToValueAtTime(value: number, endTime: number): void
  }
  connect(destination: unknown): void
}

/**
 * useAudioCue が使う Web Audio の面だけを写した最小インターフェース。
 * 本物の `AudioContext` はそのまま代入でき、テストはキャストなしで素朴な fake を渡せる。
 */
export type AudioCueContext = {
  readonly currentTime: number
  readonly destination: unknown
  resume(): Promise<void>
  suspend(): Promise<void>
  createOscillator(): AudioCueOscillator
  createGain(): AudioCueGain
}

export type AudioCueDeps = { createContext?: () => AudioCueContext }

/**
 * インターバル 0 秒到達を知らせるアラームの再生口（spec「インターバルタイマー」）。
 * start で 3 連ビープを一定間隔で鳴らし続け、stop まで止まらない。
 *
 * すべて最善努力で、失敗（非対応環境・resume 拒否・再生時の例外）はここで握って呼び出し元へ
 * 投げない。音が鳴らなくてもタイマーとセッション記録は通常どおり動くため、エラー境界へは
 * 流さない（docs/conventions.md「エラーハンドリング」）。
 *
 * AudioContext はセッションフロー全体で保持する必要がある（インターバル画面はセットごとに
 * 再マウントされる）ため、main.ts が単一インスタンスを生成して app.provide で配る。
 * deps は通常省略し、本物の AudioContext を使う。テストでのみ fake を渡す。
 */
export function useAudioCue(deps: AudioCueDeps = {}) {
  // 非対応環境では生成口自体を持たず、以降のすべての操作を no-op に縮退させる
  const createContext =
    deps.createContext ??
    (typeof AudioContext === 'function' ? () => new AudioContext() : undefined)
  // context と出力段（masterGain）は prepare で必ず対で用意されるため 1 つにまとめ、
  // 「prepare 済みか」の判定を全メソッドで同じ形にする。
  // 出力段を挟むのは、予約済みのビープを含めて一括で黙らせられるようにするため
  let audio: { context: AudioCueContext; masterGain: AudioCueGain } | undefined
  let repeatId: ReturnType<typeof setInterval> | undefined
  // 実際に鳴っているか。縮退（非対応環境・prepare 前・予約時の例外）では true にならないため、
  // 画面はこれを見れば「止める対象があるか」を正しく判断できる
  const ringing = ref(false)

  /**
   * 再生できる状態を用意する。iOS Safari はユーザージェスチャ内でしか resume を許さないため、
   * メニューの「開始」タップと、以降のセット完了タップから呼ぶ
   * （spec「AudioContext の初期化」「中断からの復帰」）。
   * 2 回目以降は生成済みのインスタンスを resume するだけ。
   */
  async function prepare() {
    if (!createContext) return
    try {
      if (!audio) {
        // 本物の AudioContext も代入できるが、以降は使用面（AudioCueContext）だけを見る
        const context: AudioCueContext = createContext()
        const masterGain = context.createGain()
        masterGain.connect(context.destination)
        audio = { context, masterGain }
      }
      await audio.context.resume()
    } catch (error) {
      console.error('AudioContext の準備に失敗しました', error)
    }
  }

  /** アラームを鳴らし始める。stop まで鳴り続ける。prepare 前・非対応環境・鳴動中は何もしない */
  function start() {
    if (!audio || ringing.value) return
    try {
      // 直前の stop でフェードアウトさせた出力段を戻す
      audio.masterGain.gain.setValueAtTime(1, audio.context.currentTime)
      ring()
      repeatId = setInterval(tryRing, BEEP_REPEAT_MS)
      ringing.value = true
    } catch (error) {
      console.error('通知音の再生に失敗しました', error)
    }
  }

  /**
   * アラームを止める。繰り返しの予約を解くだけでなく出力段をフェードアウトさせ、
   * 発音中に押されても即座に無音になるようにする（クリックノイズを避けるためランプで落とす）。
   */
  function stop() {
    clearInterval(repeatId)
    repeatId = undefined
    ringing.value = false
    if (!audio) return
    try {
      // linearRampToValueAtTime は直前のオートメーションイベントを始点にする。start() が打った
      // setValueAtTime(1, 開始時刻) のままだと、ランプは「開始時刻の 1 → now + 8ms の 0」の直線になり、
      // 数秒後に押される stop の時点ではほぼ終端なのでゲインが不連続に 0 へ跳ぶ。
      // 現在時刻で 1 を打ち直し、そこから 8 ms で落とす
      const now = audio.context.currentTime
      audio.masterGain.gain.setValueAtTime(1, now)
      audio.masterGain.gain.linearRampToValueAtTime(0, now + BEEP_RELEASE_SEC)
    } catch (error) {
      console.error('通知音の停止に失敗しました', error)
    }
  }

  /**
   * 音声出力を止める。セッション終端で呼び、次のセッションの prepare で再開させる。
   * close ではなく suspend にするのは、close した AudioContext は再利用できず、
   * 次セッションで作り直すことになるため。
   */
  async function suspend() {
    stop()
    if (!audio) return
    try {
      await audio.context.suspend()
    } catch (error) {
      console.error('AudioContext の停止に失敗しました', error)
    }
  }

  /**
   * 繰り返し用の ring。setInterval の callback は start の外側（別タスク）で走るため
   * start の catch では捕まえられず、握らないと最善努力のはずの再生失敗が
   * エラー境界へ漏れてアプリ全体が停止する。失敗したら鳴動を畳んで諦める
   */
  function tryRing() {
    try {
      ring()
    } catch (error) {
      console.error('通知音の再生に失敗しました', error)
      stop()
    }
  }

  function ring() {
    if (!audio) return
    const startAt = audio.context.currentTime
    for (let index = 0; index < BEEP_COUNT; index += 1) {
      beep(startAt + index * (BEEP_DURATION_SEC + BEEP_GAP_SEC))
    }
  }

  function beep(startAt: number) {
    if (!audio) return
    const oscillator = audio.context.createOscillator()
    const gain = audio.context.createGain()
    oscillator.type = BEEP_TYPE
    oscillator.frequency.value = BEEP_FREQUENCY_HZ
    const endAt = startAt + BEEP_DURATION_SEC
    gain.gain.setValueAtTime(0, startAt)
    gain.gain.linearRampToValueAtTime(BEEP_PEAK_GAIN, startAt + BEEP_ATTACK_SEC)
    gain.gain.setValueAtTime(BEEP_PEAK_GAIN, endAt - BEEP_RELEASE_SEC)
    gain.gain.linearRampToValueAtTime(0, endAt)
    oscillator.connect(gain)
    gain.connect(audio.masterGain)
    oscillator.start(startAt)
    oscillator.stop(endAt)
  }

  return { prepare, start, stop, suspend, ringing: readonly(ringing) }
}

export type AudioCueStore = ReturnType<typeof useAudioCue>

export const audioCueInjectionKey: InjectionKey<AudioCueStore> = Symbol('audioCue')
