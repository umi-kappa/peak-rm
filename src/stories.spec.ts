// @vitest-environment jsdom
import { describe, test } from 'vitest'
import { composeStories, setProjectAnnotations } from '@storybook/vue3-vite'
import previewAnnotations from '../.storybook/preview'

// Story の play 関数を Portable Stories 方式で実行する汎用ランナー。
// jsdom 上で composeStories → run() し、インタラクションテストを
// ブラウザ起動なしで Vitest に取り込む。
setProjectAnnotations(previewAnnotations)

// glob を CSF モジュール型で型付けし、composeStories へ cast 無しで渡す。
type StoryModule = Parameters<typeof composeStories>[0]
// composeStories の戻り値は glob 経由だと値型が unknown に落ちるため、使う run() のみ構造的に型付けする。
type RunnableStory = { run: () => Promise<void> }

// glob 対象は .storybook/main.ts の stories（'../src/**/*.stories.ts'）と揃える。
// 片方だけ変えると Storybook と Vitest で対象がドリフトするため両方を更新すること。
const storyModules = import.meta.glob<StoryModule>('./**/*.stories.ts', { eager: true })

for (const [path, storyModule] of Object.entries(storyModules)) {
  const composed = composeStories(storyModule)

  describe(path, () => {
    for (const [name, story] of Object.entries(composed)) {
      test(name, async () => {
        // run() が canvasElement を生成して story をマウントし、play を実行する。
        await (story as RunnableStory).run()
      })
    }
  })
}
