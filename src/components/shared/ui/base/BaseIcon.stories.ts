import type { Meta, StoryObj } from '@storybook/vue3-vite'
import BaseIcon from '@/components/shared/ui/base/BaseIcon.vue'
import { iconNames } from '@/assets/icons'

const meta: Meta<typeof BaseIcon> = {
  component: BaseIcon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'lucide（ISC）を出典とする SVG アイコン。`name`（union 型）で種類を指定する。SVG は vite-svg-loader でインライン展開されるため、色は親要素の `color` を `currentColor` で継承する。追加するアイコンは lucide 純正 SVG を `src/assets/icons/` に置き、同階層の `index.ts` の `iconNames` に名前を足す。',
      },
    },
  },
  argTypes: {
    name: {
      control: 'select',
      options: iconNames,
      description: 'アイコンの種類',
    },
    size: {
      control: { type: 'number', min: 12, max: 96, step: 2 },
      description: '一辺の px（正方形）',
      table: { defaultValue: { summary: '16' } },
    },
  },
  args: { name: 'chevron-right', size: 24 },
}

export default meta

type Story = StoryObj<typeof BaseIcon>

export const Playground: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
}

export const Gallery: Story = {
  // 全アイコンを並べる Story のため、単一アイコンを選ぶ name の control は意味を持たない
  argTypes: { name: { control: false } },
  render: (args) => ({
    components: { BaseIcon },
    setup: () => ({ args, names: iconNames }),
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 24px 20px; align-items: center">
        <div
          v-for="n in names"
          :key="n"
          style="display: flex; flex-direction: column; align-items: center; gap: 8px"
        >
          <BaseIcon :name="n" :size="args.size" />
          <span>{{ n }}</span>
        </div>
      </div>
    `,
  }),
}
