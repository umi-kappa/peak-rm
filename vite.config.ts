import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string
}

// Vitest / Storybook はこの config を共有するため、SW・manifest 生成を巻き込まないよう PWA を無効化する。
// Vitest は実行時に process.env.VITEST を自動設定し、Storybook は STORYBOOK を立てるため、これで判別できる。
// （この判定は load-bearing。外すとテスト・Storybook 実行時に PWA プラグインが混入する）
const enablePwa = !process.env.VITEST && !process.env.STORYBOOK

export default defineConfig({
  plugins: [
    vue(),
    // lucide の純正 SVG（src/assets/icons/*.svg）を ?component でインライン展開する。
    // svgo: false で stroke 属性などを無加工のまま保持し、currentColor 継承を効かせる。
    svgLoader({ svgo: false }),
    ...(enablePwa
      ? [
          VitePWA({
            // 新バージョンは更新確認を出さず、次回アクセス時に自動で切り替える
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
            manifest: {
              name: 'PeakRM',
              short_name: 'PeakRM',
              description: '1RM の成長を可視化するトレーニングアプリ',
              lang: 'ja',
              display: 'standalone',
              start_url: '/',
              theme_color: '#0a0a0b',
              background_color: '#0a0a0b',
              icons: [
                { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
                { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: 'maskable-icon-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
})
