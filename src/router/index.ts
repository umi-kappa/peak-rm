import {
  createRouter,
  createWebHistory,
  START_LOCATION,
  type RouteRecordRaw,
  type RouterHistory,
} from 'vue-router'

import type { SessionStore } from '@/composables/shared/session/useSession'

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
export type SessionGuard = Pick<SessionStore, 'phase' | 'leave'>

// セッションフロー内の route。フロー外への遷移で実行中セッションを終端させる判定に使う
const SESSION_FLOW_ROUTES: ReadonlySet<unknown> = new Set(['training', 'interval', 'result'])

// history を差し替え可能にして、テストでは createMemoryHistory を注入できるようにする。
export function createAppRouter(
  session: SessionGuard,
  history: RouterHistory = createWebHistory(),
) {
  const router = createRouter({ history, routes })

  router.beforeEach((to, from) => {
    // 新規ロード・リロード（SW autoUpdate 含む）・ディープリンクは常にホーム起動にする。
    // 実行中セッションやスクロール位置などの view-state は永続化せず、中断したセッションは
    // 履歴に残るだけで自動再開しない（spec「ホーム画面」）。
    // from === START_LOCATION はアプリ起動後の最初の遷移、すなわちページロード直後を表す。
    if (from === START_LOCATION && to.name !== 'home') {
      return { name: 'home', replace: true }
    }
    // 実行中セッションが終端していれば training / interval には入れない（ブラウザの進む等での再入防止）。
    // result はガードしない: 履歴詳細からも開くため（spec「結果確認画面」）
    if ((to.name === 'training' || to.name === 'interval') && session.phase.value === 'done') {
      return { name: 'home', replace: true }
    }
  })

  // セッションフローの外へ出たら実行中セッションを終端させる（spec「セッションフローからの離脱」）。
  // ブラウザ / OS の戻るによる離脱を含むため、遷移確定後の afterEach で一律に確定する
  router.afterEach((to, from) => {
    if (SESSION_FLOW_ROUTES.has(from.name) && !SESSION_FLOW_ROUTES.has(to.name)) {
      session.leave()
    }
  })

  return router
}
