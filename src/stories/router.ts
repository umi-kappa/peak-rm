import { createMemoryHistory, createRouter } from 'vue-router'

// Storybook 全体で 1 度だけ app.use する共有 router。
// 各 stories が個別に app.use すると、Storybook の単一 app に複数の router が
// install され、vue-router が $route を再定義しようとして
// "Cannot redefine property: $route" になる。preview.ts で 1 度だけ install する。
// routes は router-link を描画する全 stories の遷移先を束ねたダミー（実構成は router/index.ts）。
export const storybookRouter = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div />' } },
    { path: '/settings', name: 'settings', component: { template: '<div />' } },
    { path: '/history', name: 'history', component: { template: '<div />' } },
    { path: '/:exercise/menu', name: 'menu', component: { template: '<div />' } },
    // 汎用ボタン（CardButton / IconButton）の任意の遷移先を受ける catch-all
    { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
  ],
})
