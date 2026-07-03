import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'

const meta: Meta<typeof ScreenFrame> = {
  component: ScreenFrame,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '画面の外殻。ビューポート全高（`100dvh`）の縦 flex 列で、`header` slot に AppBar（任意）を固定し、default slot の本文が残りを占めてスクロールする。本文は左右 padding と縦 gap（標準 20）を固定で持つ（旧 ScreenBody を内包）。`footer` slot は本文のスクロール領域の外に置かれ、下部アクション（Menu の開始ボタンなど）をスクロール時も画面下端に固定する。Home のようにヘッダーを持たない画面は `header` slot を省略する。`flushBottom` で footer 下端の padding を落とし、ナビ行（Home）などを画面下端まで詰められる。',
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

// footer slot: 下部アクションをスクロール領域の外に固定する（Menu の開始ボタンなど）
export const WithFooter: Story = {
  render: () => ({
    components: { ScreenFrame, AppBar, BaseButton, BaseCard },
    template: `
      <ScreenFrame>
        <template #header><AppBar title="BENCH PRESS" /></template>
        <BaseCard v-for="n in 12" :key="n">Card {{ n }}</BaseCard>
        <template #footer><BaseButton>START SESSION</BaseButton></template>
      </ScreenFrame>`,
  }),
}

// flushBottom: footer 下端の padding を落とし、ナビ行などを画面下端まで詰める
export const FlushBottom: Story = {
  render: () => ({
    components: { ScreenFrame, BaseCard },
    template: `
      <ScreenFrame flush-bottom>
        <BaseCard>Bench Press</BaseCard>
        <template #footer>
          <div style="border-top: 1px solid var(--color-line-dark); padding: 16px 4px;">
            HISTORY
          </div>
        </template>
      </ScreenFrame>`,
  }),
}
