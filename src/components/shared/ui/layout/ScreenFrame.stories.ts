import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'

const meta: Meta<typeof ScreenFrame> = {
  component: ScreenFrame,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '画面の外殻。ビューポート全高（`100dvh`）の縦 flex 列で、`header` slot に AppBar（任意）を固定し、default slot の本文が残りを占めてスクロールする。本文は左右 padding と縦 gap（標準 20）を固定で持つ（旧 ScreenBody を内包）。Home のようにヘッダーを持たない画面は `header` slot を省略する。',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof ScreenFrame>

// header slot に AppBar、本文にカードを積んだ標準構成
export const Default: Story = {
  render: () => ({
    components: { ScreenFrame, AppBar, BaseCard },
    template: `
      <ScreenFrame>
        <template #header><AppBar title="HISTORY" /></template>
        <BaseCard>Est. 1RM chart</BaseCard>
        <BaseCard>Session 05/12</BaseCard>
        <BaseCard>Session 05/09</BaseCard>
      </ScreenFrame>`,
  }),
}

// header slot を省略した構成（Home など AppBar を持たない最上位画面）
export const NoHeader: Story = {
  render: () => ({
    components: { ScreenFrame, BaseCard },
    template: `
      <ScreenFrame>
        <BaseCard>Bench Press</BaseCard>
        <BaseCard>Squat</BaseCard>
        <BaseCard>Deadlift</BaseCard>
      </ScreenFrame>`,
  }),
}
