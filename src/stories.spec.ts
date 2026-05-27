// @vitest-environment jsdom
import { describe, test } from 'vitest'
import { composeStories, setProjectAnnotations } from '@storybook/vue3-vite'
import previewAnnotations from '../.storybook/preview'

// Story の play 関数を Portable Stories 方式で実行する汎用ランナー。
// jsdom 上で composeStories → run() し、インタラクションテストを
// ブラウザ起動なしで Vitest に取り込む。
setProjectAnnotations(previewAnnotations)

// composeStories の戻り値は glob 経由だと値型が unknown に落ちるため、使用する run() のみを構造的に型付けする。
type RunnableStory = { run: () => Promise<void> }

const storyModules = import.meta.glob('./**/*.stories.ts', { eager: true })

for (const [path, storyModule] of Object.entries(storyModules)) {
  const composed = composeStories(storyModule as Parameters<typeof composeStories>[0])

  describe(path, () => {
    for (const [name, story] of Object.entries(composed)) {
      test(name, async () => {
        // run() が canvasElement を生成して story をマウントし、play を実行する。
        await (story as RunnableStory).run()
      })
    }
  })
}
