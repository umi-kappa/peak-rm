import type { FunctionalComponent, SVGAttributes } from 'vue'

// アイコン名の一覧。typo は、この配列から導出される union 型 IconName により typecheck（vue-tsc）で検出できる。
// SVG 実体は同階層の <name>.svg（lucide 純正・ISC。NOTICE 参照）。
// アイコンを追加するときは、その名前で lucide 純正の SVG ファイルを 1 つ置き、この配列に名前を 1 つ追加する。
export const iconNames = [
  'arrow-up',
  'check',
  'chevron-left',
  'chevron-right',
  'download',
  'file-text',
  'history',
  'minus',
  'pen-line',
  'plus',
  'settings',
  'trash-2',
  'trending-up',
  'upload',
] as const

export type IconName = (typeof iconNames)[number]

// 同階層の *.svg を ?component でインライン展開し、ファイル名（= IconName）で引けるマップにする。
// eager: true により同期的に import する。各 SVG はルートに stroke="currentColor" を持つため、
// 色は親要素の color から継承される（vite.config の svgLoader は svgo: false で属性を保持する）。
const modules = import.meta.glob<{ default: FunctionalComponent<SVGAttributes> }>(
  '@/assets/icons/*.svg',
  { query: '?component', eager: true },
)

export const icons = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.svg'.length),
    mod.default,
  ]),
) as Record<IconName, FunctionalComponent<SVGAttributes>>
