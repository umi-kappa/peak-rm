import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import storybook from 'eslint-plugin-storybook'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    // ビルド成果物 storybook-static/ は除外しつつ、.storybook/ 設定ファイル本体は lint 対象に含める
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'storybook-static/**', '!.storybook'],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  ...storybook.configs['flat/recommended'],
  {
    name: 'app/no-null',
    files: ['**/*.{ts,mts,tsx,vue}'],
    plugins: { unicorn: eslintPluginUnicorn },
    // 値の不在は null ではなく undefined で統一する（Dexie / Array.at() / ?? の自然な返り値に揃える）。
    rules: { 'unicorn/no-null': 'error' },
  },
  {
    name: 'app/page-entry-names',
    // 画面エントリは規約上 pages/<画面>/index.vue（Nuxt 風命名）。ファイル名がルートで一意なので
    // multi-word 強制の対象外にする（命名規約は docs/conventions.md「ファイル命名」を参照）。
    files: ['src/pages/**/index.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  skipFormatting,
)
