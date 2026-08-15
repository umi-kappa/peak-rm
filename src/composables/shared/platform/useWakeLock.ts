import type { InjectionKey } from 'vue'

/** useWakeLock が使う面だけに絞った sentinel。テストはキャストなしで素朴な fake を渡せる */
export type WakeLockHandle = Pick<WakeLockSentinel, 'released' | 'release'>

export type WakeLockDeps = { requestScreenLock?: () => Promise<WakeLockHandle> }

/**
 * トレーニング中の画面スリープを防ぐ最善努力の Wake Lock（spec「インターバルタイマー」）。
 * 失敗（非対応環境・拒否・解除時の例外）はすべてここで握り、呼び出し元へ投げない。
 * iOS では取得拒否が日常的に起こるが、拒否されてもタイマーは動くためエラー境界へは流さない
 * （docs/conventions.md「エラーハンドリング」）。
 *
 * sentinel はセッションフロー全体で保持する必要があるため、main.ts が単一インスタンスを
 * 生成して app.provide で配る。deps は通常省略し、本物の navigator.wakeLock を使う。
 */
export function useWakeLock(deps: WakeLockDeps = {}) {
  // 非対応ブラウザでは navigator.wakeLock 自体が存在しない（型の上では必ず在るため実行時に確かめる）。
  // 取得口を持たない場合は以降のすべての操作を no-op に縮退させる
  const requestScreenLock =
    deps.requestScreenLock ??
    (navigator.wakeLock ? () => navigator.wakeLock.request('screen') : undefined)
  let sentinel: WakeLockHandle | undefined
  // 取得の世代。release のたびに進め、取得待ちの間に終端したかを解決時に判定する
  let generation = 0

  /**
   * 画面スリープの抑止を要求する。AudioContext の初期化とライフサイクルを揃えるため、
   * メニューの「開始」タップから呼ぶ（spec「Wake Lock のライフサイクル」）。
   */
  async function acquire() {
    if (!requestScreenLock || sentinel) return
    const requested = generation
    let acquired: WakeLockHandle
    try {
      acquired = await requestScreenLock()
    } catch (error) {
      console.error('Wake Lock の取得に失敗しました', error)
      return
    }
    // 取得を待つ間にセッションが終端していた場合、この sentinel は持ち主がいない。
    // 保持すると次セッションの acquire が短絡し、スリープ抑止が二度と効かなくなる
    if (requested !== generation) {
      await releaseHandle(acquired)
      return
    }
    sentinel = acquired
  }

  /**
   * 抑止を解除する。実行中セッションの終端（完了・中断・フローからの離脱・fatal error）で呼ぶ。
   * タブの背景化でブラウザが自動解除した sentinel は released を見て触らない
   * （前景復帰時の再取得は行わない）。
   */
  async function release() {
    generation += 1
    const current = sentinel
    sentinel = undefined
    if (!current) return
    await releaseHandle(current)
  }

  async function releaseHandle(handle: WakeLockHandle) {
    if (handle.released) return
    try {
      await handle.release()
    } catch (error) {
      console.error('Wake Lock の解除に失敗しました', error)
    }
  }

  return { acquire, release }
}

export type WakeLockStore = ReturnType<typeof useWakeLock>

export const wakeLockInjectionKey: InjectionKey<WakeLockStore> = Symbol('wakeLock')
