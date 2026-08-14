import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useAudioCue, type AudioCueContext } from '@/composables/shared/platform/useAudioCue'

// 本物の AudioContext は happy-dom に無く、あっても音を鳴らしてしまうため、
// useAudioCue が使う面だけを持つ fake を渡す（satisfies で面の過不足を型で検証する）。
// createGain は出力段（prepare で 1 つ）とビープごとに呼ばれるため、呼び出しごとに別物を返す
function makeFakeContext() {
  const oscillator = {
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
  const gains: ReturnType<typeof makeFakeGain>[] = []
  const context = {
    currentTime: 10,
    destination: {},
    resume: vi.fn(async () => {}),
    suspend: vi.fn(async () => {}),
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => {
      const gain = makeFakeGain()
      gains.push(gain)
      return gain
    }),
  } satisfies AudioCueContext
  // prepare が最初に作る gain が出力段（全ビープがここへつながる）
  return { context, oscillator, gains, masterGain: () => gains[0] }
}

function makeFakeGain() {
  return {
    gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  }
}

// 鳴らせる状態まで進めた一式。大半のテストはここから始まる
async function preparedAudioCue() {
  const fake = makeFakeContext()
  const audioCue = useAudioCue({ createContext: () => fake.context })
  await audioCue.prepare()
  return { audioCue, ...fake }
}

describe('useAudioCue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 縮退時の console.error はテスト出力に出さず、呼ばれたことだけを検証する
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  test('prepare で AudioContext を生成して resume し、出力段を destination につなぐ', async () => {
    const { context, masterGain } = await preparedAudioCue()
    expect(context.resume).toHaveBeenCalledTimes(1)
    expect(masterGain().connect).toHaveBeenCalledWith(context.destination)
  })

  test('prepare を繰り返しても AudioContext は作り直さない', async () => {
    const { context } = makeFakeContext()
    const createContext = vi.fn(() => context)
    const audioCue = useAudioCue({ createContext })
    await audioCue.prepare()
    await audioCue.prepare()
    expect(createContext).toHaveBeenCalledTimes(1)
    expect(context.resume).toHaveBeenCalledTimes(2)
  })

  test('prepare 前は鳴らず、start / suspend も何もしない', async () => {
    const { context } = makeFakeContext()
    const audioCue = useAudioCue({ createContext: () => context })
    audioCue.start()
    await audioCue.suspend()
    expect(audioCue.ringing.value).toBe(false)
    expect(context.createOscillator).not.toHaveBeenCalled()
    expect(context.suspend).not.toHaveBeenCalled()
  })

  test('start は 2 連のビープを予約し出力段へつなぐ', async () => {
    const { audioCue, context, oscillator, gains, masterGain } = await preparedAudioCue()
    audioCue.start()
    const startTimes = oscillator.start.mock.calls.flat()
    expect(startTimes).toHaveLength(2)
    // 1 発目は現在時刻から、2 発目は間隔を空けて後ろに予約する
    expect(startTimes[0]).toBe(context.currentTime)
    expect(startTimes[1]).toBeGreaterThan(startTimes[0])
    expect(oscillator.stop).toHaveBeenCalledTimes(2)
    // ビープごとの gain は出力段へ、出力段だけが destination へつながる
    expect(gains.at(-1)?.connect).toHaveBeenCalledWith(masterGain())
  })

  test('start 後は止めるまで一定間隔で鳴り続ける', async () => {
    const { audioCue, oscillator } = await preparedAudioCue()
    audioCue.start()
    expect(audioCue.ringing.value).toBe(true)
    expect(oscillator.start).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(3000)
    expect(oscillator.start).toHaveBeenCalledTimes(4)
    await vi.advanceTimersByTimeAsync(3000)
    expect(oscillator.start).toHaveBeenCalledTimes(6)
  })

  test('鳴動中の start は二重に鳴らさない', async () => {
    const { audioCue, oscillator } = await preparedAudioCue()
    audioCue.start()
    audioCue.start()
    expect(oscillator.start).toHaveBeenCalledTimes(2)
  })

  test('stop で繰り返しが止まり、出力段をフェードアウトさせる', async () => {
    const { audioCue, oscillator, masterGain } = await preparedAudioCue()
    audioCue.start()
    audioCue.stop()
    expect(audioCue.ringing.value).toBe(false)
    // 発音中に押されても即座に無音にするため、出力段を 0 へ落とす
    expect(masterGain().gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number))
    await vi.advanceTimersByTimeAsync(9000)
    expect(oscillator.start).toHaveBeenCalledTimes(2)
  })

  test('stop 後に start すると再び鳴る', async () => {
    const { audioCue, oscillator } = await preparedAudioCue()
    audioCue.start()
    audioCue.stop()
    audioCue.start()
    expect(audioCue.ringing.value).toBe(true)
    expect(oscillator.start).toHaveBeenCalledTimes(4)
  })

  test('suspend は鳴動を止めてから AudioContext を止める', async () => {
    const { audioCue, context, oscillator } = await preparedAudioCue()
    audioCue.start()
    await audioCue.suspend()
    expect(audioCue.ringing.value).toBe(false)
    expect(context.suspend).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(9000)
    expect(oscillator.start).toHaveBeenCalledTimes(2)
  })

  test('AudioContext の生成に失敗しても呼び出し元へ投げない', async () => {
    const audioCue = useAudioCue({
      createContext: () => {
        throw new Error('AudioContext is not allowed')
      },
    })
    await expect(audioCue.prepare()).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalled()
  })

  test('resume が拒否されても呼び出し元へ投げない', async () => {
    const { context } = makeFakeContext()
    context.resume.mockImplementation(async () => {
      throw new Error('not allowed')
    })
    const audioCue = useAudioCue({ createContext: () => context })
    await expect(audioCue.prepare()).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalled()
  })

  test('再生時の例外を握り、鳴動中とは見なさない', async () => {
    const { audioCue, context } = await preparedAudioCue()
    context.createOscillator.mockImplementation(() => {
      throw new Error('too many nodes')
    })
    expect(() => audioCue.start()).not.toThrow()
    expect(audioCue.ringing.value).toBe(false)
    expect(console.error).toHaveBeenCalled()
  })

  test('AudioContext を持たない環境では何もしない', async () => {
    vi.stubGlobal('AudioContext', undefined)
    const audioCue = useAudioCue()
    await expect(audioCue.prepare()).resolves.toBeUndefined()
    expect(() => audioCue.start()).not.toThrow()
    expect(() => audioCue.stop()).not.toThrow()
    await expect(audioCue.suspend()).resolves.toBeUndefined()
    expect(audioCue.ringing.value).toBe(false)
    expect(console.error).not.toHaveBeenCalled()
  })
})
