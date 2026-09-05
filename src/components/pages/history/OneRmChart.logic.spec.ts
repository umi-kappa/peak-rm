import { afterEach, expect, test, vi } from 'vitest'

import { buildChartData } from '@/components/pages/history/OneRmChart.logic'

// getComputedStyle を差し替え、カスタムプロパティの解決結果を制御する
function stubComputedStyle(values: Record<string, string>) {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    fontSize: '10px',
    getPropertyValue: (name: string) => values[name] ?? '',
  } as unknown as CSSStyleDeclaration)
}

const RESOLVED = {
  '--color-accent': 'rgb(1, 2, 3)',
  '--color-bg': 'rgb(4, 5, 6)',
  '--color-text': 'rgb(7, 8, 9)',
  '--color-line': 'rgb(10, 11, 12)',
  '--color-line-dark': 'rgb(13, 14, 15)',
  '--font-size-body': '1.4rem',
  '--font-weight-bold': '700',
  '--font-family-mono': 'monospace',
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('カスタムプロパティが未解決のうちに呼ばれても空文字を恒久キャッシュしない', () => {
  stubComputedStyle({})
  expect(buildChartData([100]).datasets[0]?.borderColor).toBe('')

  // 解決後の呼び出しでは新しい値を読み直す
  stubComputedStyle(RESOLVED)
  expect(buildChartData([100]).datasets[0]?.borderColor).toBe('rgb(1, 2, 3)')
})
