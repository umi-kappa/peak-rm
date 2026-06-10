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
        optimizeDeps: {
          include: ['vue'],
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
