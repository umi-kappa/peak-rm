import { fileURLToPath } from 'node:url'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

const storybookDir = fileURLToPath(new URL('./.storybook', import.meta.url))

export default defineConfig({
  test: {
    projects: [
      // ロジック層の単体テスト（DOM API を使えるよう happy-dom）。
      {
        extends: './vite.config.ts',
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: ['src/**/*.spec.ts'],
          // TZ を非 UTC かつ DST の無いものに固定する。CI 既定の UTC ではローカル日付と
          // UTC 日付が一致するため、core/localDay の「ローカル基準で日を判定する」保証
          // （toISOString への退化）をテストが検出できない。DST のある TZ は
          // new Date(y, m, d, h, 0) が存在しない時刻・重複する時刻に当たりうるため避ける。
          env: { TZ: 'Asia/Tokyo' },
          // happy-dom は IndexedDB を持たないため fake-indexeddb で global を補う。
          setupFiles: ['fake-indexeddb/auto'],
        },
      },
      // Story の play 関数を headless Chromium（Playwright）で実行する。
      // storybookTest が .storybook/main.ts の stories を自動でテスト化する。
      {
        extends: './vite.config.ts',
        plugins: [storybookTest({ configDir: storybookDir })],
        // Storybook の vue3 フレームワークは template 文字列をコンパイルするため
        // vue を full build（vue/dist/vue.esm-bundler.js）にエイリアスする。これは Vite の
        // 事前スキャンでは発見されず、初回実行（CI 等のキャッシュなし環境）の途中で
        // 最適化 → 強制リロードが走ってテストが落ちるため、事前最適化の対象に明示する
        // （include のエントリにもエイリアスが適用されるため、エイリアス前の vue で指定）。
        // dexie も同様: ページ stories が useSession（→ sessionRepo → dexie）を import するが、
        // stories の動的 import 経由のため事前スキャンに乗らない。
        optimizeDeps: {
          include: ['vue', 'dexie'],
        },
        test: {
          name: 'storybook',
          // preview.ts の annotations は @storybook/addon-vitest が自動適用する（v10.3+）。
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
