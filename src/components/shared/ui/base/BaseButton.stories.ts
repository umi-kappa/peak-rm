import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'

const meta: Meta<typeof BaseButton> = {
  component: BaseButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'ボタンの基底プリミティブ。`variant` で見た目を切り替える。`primary` はアクセント色の塗りで主アクション、`secondary` は塗りを持たず細い境界線とグレーの文字で控えめに見せる。`disabled` は一時的に押せないことを示し、variant を問わず面と枠線をカードと同じ色に置いて文字色を一段落とす（`primary` はアクセントの塗りが外れ、`secondary` は透明だった面に塗りが付く）。',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary'],
      description: '見た目の種類',
      table: { defaultValue: { summary: 'primary' } },
    },
    disabled: {
      control: 'boolean',
      description: '一時的に押せないことを示す',
    },
  },
  args: { variant: 'primary' },
  render: (args) => ({
    components: { BaseButton },
    setup: () => ({ args }),
    template: `<BaseButton v-bind="args">BUTTON</BaseButton>`,
  }),
}

export default meta

type Story = StoryObj<typeof BaseButton>

export const Default: Story = {}

export const Secondary: Story = {
  args: { variant: 'secondary' },
}

// 常設ボタンがデータの読み込み待ちなどで一時的に押せない状態（メニュー設定の START SESSION）
export const Disabled: Story = {
  args: { disabled: true },
}

// secondary の disabled は透明だった面にカードの塗りが付く（primary と同じ面・枠線・文字色に揃う）
export const DisabledSecondary: Story = {
  args: { variant: 'secondary', disabled: true },
}

// disabled が DOM に届いてタップを実際に止める配線だけを確認する（見た目は Disabled が担う）。
// BaseButton は click を emit せずネイティブの listener をそのまま受けるため、スパイは loaders で渡す
export const DisabledBehavior: Story = {
  args: { disabled: true },
  parameters: { chromatic: { disableSnapshot: true } },
  loaders: [() => ({ onClick: fn() })],
  render: (args, { loaded }) => ({
    components: { BaseButton },
    setup: () => ({ args, onClick: loaded.onClick }),
    template: `<BaseButton v-bind="args" @click="onClick">BUTTON</BaseButton>`,
  }),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    await expect(button).toBeDisabled()

    await userEvent.click(button)
    await expect(loaded.onClick).not.toHaveBeenCalled()
  },
}
