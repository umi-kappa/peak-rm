import { expect, test } from 'vitest'
import { iconNames, icons } from '@/assets/icons'

// icons は as Record キャストで型を確定しているため、iconNames への名前追加と
// SVG ファイル設置のずれは typecheck では検出できない。ここで実体との一致を保証する。
test('iconNames と SVG ファイルが 1 対 1 に対応している', () => {
  expect(Object.keys(icons).sort()).toEqual([...iconNames].sort())
})
