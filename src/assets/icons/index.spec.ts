import { expect, test } from 'vitest'
import { iconNames, icons } from '@/assets/icons'
import notice from '@/assets/icons/NOTICE?raw'

// icons は as Record キャストで型を確定しているため、iconNames への名前追加と
// SVG ファイル設置のずれは typecheck では検出できない。ここで実体との一致を保証する。
test('iconNames と SVG ファイルが 1 対 1 に対応している', () => {
  expect(Object.keys(icons).sort()).toEqual([...iconNames].sort())
})

test('NOTICE の由来リストの和が iconNames と一致し、件数表記もリストと揃う', () => {
  const feather = notice.match(/derived from the Feather project:\s*([^\r\n]+)/)?.[1]
  const lucide = notice.match(/残り (.+) は lucide 独自/)?.[1]

  expect(feather).toBeDefined()
  expect(lucide).toBeDefined()
  const featherNames = feather?.split(',').map((name) => name.trim()) ?? []
  const names = [...featherNames, ...(lucide?.split(' / ') ?? [])]
  expect(names.sort()).toEqual([...iconNames].sort())

  // 列挙と件数表記は NOTICE 内の別の行なので、片方だけ直した取り残しをここで検出する
  const declared = Number(notice.match(/上記 (\d+) 種が Feather 由来/)?.[1])
  expect(featherNames).toHaveLength(declared)
})
