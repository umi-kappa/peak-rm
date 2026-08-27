import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// icon-source.svg が不透明な背景とマスク用セーフゾーンを内包しているため、
// ジェネレータ既定の余白（transparent 0.05 / maskable・apple 0.3）を打ち消して原寸で出力する。
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
})
