import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { createMemoryHistory, createRouter } from 'vue-router'
import BrandBar from '@/components/pages/home/BrandBar.vue'

// Settings の IconButton は to で name: 'settings' へ遷移するため、最小の router を全 Story に提供する。
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div />' } },
    { path: '/settings', name: 'settings', component: { template: '<div />' } },
  ],
})
setup((app) => app.use(router))

const meta: Meta<typeof BrandBar> = {
  component: BrandBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Home 上部のブランドバー。`PeakRM` + タグライン（左）と Settings への IconButton（右）。タップで設定画面へ遷移する。',
      },
    },
  },
  decorators: [() => ({ template: '<div style="width: 342px;"><story /></div>' })],
}

export default meta

type Story = StoryObj<typeof BrandBar>

export const Default: Story = {}

// Settings アイコンのタップで設定画面へ遷移する配線だけを確認する
export const Behavior: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await router.push('/')
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('link', { name: 'Settings' }))
    await waitFor(() => expect(router.currentRoute.value.name).toBe('settings'))
  },
}
