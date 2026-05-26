import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import storybook from 'eslint-plugin-storybook'

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
  skipFormatting,
)
