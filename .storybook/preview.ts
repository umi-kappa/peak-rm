import type { Preview } from '@storybook/vue3-vite'
import '@/styles/global.css'

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
