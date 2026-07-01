import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { storybookRouter } from '@/stories/router'
import '@/styles/tokens.css'
import '@/styles/global.css'

// router は全 stories 共通で 1 度だけ install する（各 stories で app.use すると $route 再定義で落ちる）
setup((app) => app.use(storybookRouter))

const preview: Preview = {
  parameters: {
    // Chromatic snapshot は viewport 1 つ（390px・モバイル前提）のみ。ブラウザは Chrome のみ（デフォルト）。
    chromatic: { viewports: [390] },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0b' },
        { name: 'surface', value: '#141416' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
