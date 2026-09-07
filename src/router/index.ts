import {
  createRouter,
  createWebHistory,
  START_LOCATION,
  type RouteLocationNormalized,
  type RouteLocationRaw,
  type RouteRecordRaw,
  type RouterHistory,
} from 'vue-router'

import type { SessionStore, TrainingPhase } from '@/composables/shared/session/useSession'
import type { SessionLeaveConfirmStore } from '@/composables/shared/session/useSessionLeaveConfirm'

// 結果確認画面の遷移元。戻り導線をこれで動的に切り替える（spec「結果確認画面」）。
// session = トレーニング完了・中断経由 / history = 履歴一覧から開いた。
export type ResultOrigin = 'session' | 'history'

// 種目をトップレベルのコンテキストにし、セッションフロー（menu → training → interval → result）を
// その下にぶら下げる。1 セッション = 1 種目という不変条件と一致し、各画面が route から種目を取れる。
// :exercise は Exercise union 値（benchPress / squat / deadlift）をそのまま使う。
// home / history / settings は種目に属さないグローバル画面なので top-level に置く。
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/pages/home/index.vue') },
  {
    path: '/:exercise/menu',
    name: 'menu',
    component: () => import('@/pages/[exercise]/menu/index.vue'),
  },
  {
    path: '/:exercise/training',
    name: 'training',
    component: () => import('@/pages/[exercise]/training/index.vue'),
  },
  {
    path: '/:exercise/interval',
    name: 'interval',
    component: () => import('@/pages/[exercise]/interval/index.vue'),
  },
  {
    path: '/:exercise/result',
    name: 'result',
    component: () => import('@/pages/[exercise]/result/index.vue'),
  },
  { path: '/history', name: 'history', component: () => import('@/pages/history/index.vue') },
  { path: '/settings', name: 'settings', component: () => import('@/pages/settings/index.vue') },
]

// ガードが必要とする実行中セッションの最小面。main.ts が useSession の単一インスタンスを渡す
//（テストでは fake を渡す）。
export type SessionGuard = Pick<SessionStore, 'phase' | 'leave' | 'settled'>

// 離脱確認のガードが使う面。App.vue が同じインスタンスの pending を見て確認ダイアログを描く
export type SessionLeaveConfirmGuard = Pick<SessionLeaveConfirmStore, 'request' | 'generation'>

// セッションフロー内の route。フロー外への遷移で実行中セッションを終端させる判定に使う
const SESSION_FLOW_ROUTES: ReadonlySet<unknown> = new Set(['training', 'interval', 'result'])

// 実行中セッションの画面。終端後の再入禁止と、ここからフロー外へ出る遷移の離脱確認に使う
const ACTIVE_SESSION_ROUTES: ReadonlySet<unknown> = new Set(['training', 'interval'])

// 実行中セッションの phase に対応する画面（spec「画面遷移」）
const SESSION_ROUTE_FOR_PHASE: Record<TrainingPhase, 'training' | 'interval' | 'result'> = {
  setActive: 'training',
  interval: 'interval',
  done: 'result',
}

// 離脱確認をキャンセルしたときに留める先。問い合わせている間にセット完了の記録が済んで phase が
// 進んでいれば、元の画面ではなく phase の画面へ進める（完了したセットを巻き戻さない）。
// 戻る（popstate）由来ならこの時点で履歴の位置は戻る先へ移っており、その redirect は push で確定する
// ため、前方の段が切り捨てられて「ホーム → 現在画面」に収まる
function stayLocation(
  phase: TrainingPhase,
  from: RouteLocationNormalized,
): false | RouteLocationRaw {
  const name = SESSION_ROUTE_FOR_PHASE[phase]
  if (name === from.name) return false
  const origin: ResultOrigin = 'session'
  return name === 'result'
    ? { name, params: from.params, query: { origin } }
    : { name, params: from.params }
}

// history を差し替え可能にして、テストでは createMemoryHistory を注入できるようにする。
export function createAppRouter(
  session: SessionGuard,
  leaveConfirm: SessionLeaveConfirmGuard,
  history: RouterHistory = createWebHistory(),
) {
  const router = createRouter({ history, routes })

  router.beforeEach(async (to, from) => {
    // 新規ロード・リロード（SW autoUpdate 含む）・ディープリンクは常にホーム起動にする。
    // 実行中セッションやスクロール位置などの view-state は永続化せず、中断したセッションは
    // 履歴に残るだけで自動再開しない（spec「ホーム画面」）。
    // from === START_LOCATION はアプリ起動後の最初の遷移、すなわちページロード直後を表す。
    if (from === START_LOCATION && to.name !== 'home') {
      return { name: 'home', replace: true }
    }
    // 実行中セッションが終端していれば training / interval には入れない（ブラウザの進む等での再入防止）。
    // result はガードしない: 履歴詳細からも開くため（spec「結果確認画面」）
    if (ACTIVE_SESSION_ROUTES.has(to.name) && session.phase.value === 'done') {
      return { name: 'home', replace: true }
    }
    // トレーニング中・インターバル中からフロー外へ出る遷移（ブラウザ / OS の戻る・AppBar の ←）は
    // 確認なしに中断を確定させない（spec「セッションフローからの離脱」）。false で取り消すと
    // popstate 由来の遷移は Vue Router が URL を元に戻す。フロー内の遷移と終端後の離脱は対象外
    if (
      ACTIVE_SESSION_ROUTES.has(from.name) &&
      !SESSION_FLOW_ROUTES.has(to.name) &&
      session.phase.value !== 'done'
    ) {
      const leaving = leaveConfirm.request()
      // request() が同期的に generation を進めるので、直後に読むと自分の問い合わせの世代が取れる
      const asked = leaveConfirm.generation.value
      if (await leaving) return true
      // 別の離脱操作に追い越された問い合わせは取り消しで畳まれる。その false はユーザーの答えではないので、
      // 進む先を決めずにこの遷移を取り消すだけにする（行き先は新しい問い合わせの答えが決める）。
      // 書き込みを待たずに取り消すのは、Vue Router の履歴復元が遅れて次の遷移と競合しないようにするため
      if (leaveConfirm.generation.value !== asked) return false
      // キャンセル。セット完了の書き込みが進行中なら、終わるのを待ってから行き先を決める
      //（答えが書き込みより先に返っても、進んだ phase の画面へ進めるため。画面側は待つ間に
      // 問い合わせが開いたら遷移しないので、行き先を決めるのはここだけ）。待つ間に畳まれたら同じく取り消す
      await session.settled()
      if (leaveConfirm.generation.value !== asked) return false
      return stayLocation(session.phase.value, from)
    }
  })

  // セッションフローの外へ出たら実行中セッションを終端させる（spec「セッションフローからの離脱」）。
  // ブラウザ / OS の戻るによる離脱を含むため、遷移確定後の afterEach で一律に確定する。
  // afterEach は離脱確認のキャンセル等で取り消された遷移にも failure 付きで呼ばれるため、その場合は終端しない
  router.afterEach((to, from, failure) => {
    if (failure) return
    if (SESSION_FLOW_ROUTES.has(from.name) && !SESSION_FLOW_ROUTES.has(to.name)) {
      session.leave()
    }
  })

  return router
}
