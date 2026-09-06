import { afterEach, describe, expect, test, vi } from 'vitest'

// getComputedStyle を差し替え、カスタムプロパティの解決結果を制御する
function stubComputedStyle(values: Record<string, string>) {
  return vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    fontSize: '10px',
    getPropertyValue: (name: string) => values[name] ?? '',
  } as unknown as CSSStyleDeclaration)
}

const RESOLVED_COLORS = {
  '--color-accent': 'rgb(1, 2, 3)',
  '--color-bg': 'rgb(4, 5, 6)',
  '--color-text': 'rgb(7, 8, 9)',
  '--color-line': 'rgb(10, 11, 12)',
  '--color-line-dark': 'rgb(13, 14, 15)',
}

const RESOLVED = {
  ...RESOLVED_COLORS,
  '--font-size-body': '1.4rem',
  '--font-weight-bold': '700',
  '--font-family-mono': 'monospace',
}

// chartTokens は解決結果をモジュールスコープにキャッシュするため、テストごとにモジュールを読み直す
async function loadLogic() {
  vi.resetModules()
  return import('@/components/pages/history/OneRmChart.logic')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('buildChartData', () => {
  test('カスタムプロパティが未解決のうちに呼ばれても空文字を恒久キャッシュしない', async () => {
    const { buildChartData } = await loadLogic()
    stubComputedStyle({})
    expect(buildChartData([100]).datasets[0]?.borderColor).toBe('')

    // 解決後の呼び出しでは新しい値を読み直す
    stubComputedStyle(RESOLVED)
    expect(buildChartData([100]).datasets[0]?.borderColor).toBe('rgb(1, 2, 3)')
  })

  test('色だけ解決済みでフォントが未解決の結果もキャッシュしない', async () => {
    const { buildChartData } = await loadLogic()
    stubComputedStyle(RESOLVED_COLORS)
    expect(buildChartData([100]).datasets[0]?.borderColor).toBe('rgb(1, 2, 3)')

    // 全値が揃った次の呼び出しで読み直される（色だけの結果で確定していない）
    stubComputedStyle({ ...RESOLVED, '--color-accent': 'rgb(9, 9, 9)' })
    expect(buildChartData([100]).datasets[0]?.borderColor).toBe('rgb(9, 9, 9)')
  })

  test('全値が解決できたら以降は getComputedStyle を呼ばず初回の結果を使い回す', async () => {
    const { buildChartData } = await loadLogic()
    const spy = stubComputedStyle(RESOLVED)
    buildChartData([100])
    // 値が変わってもキャッシュを返す（このアプリはテーマ切り替えを持たず値が実行中に変わらない）
    stubComputedStyle({ ...RESOLVED, '--color-accent': 'rgb(9, 9, 9)' })
    expect(buildChartData([100]).datasets[0]?.borderColor).toBe('rgb(1, 2, 3)')
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('buildChartOptions', () => {
  test('軸・アニメーション・イベントを切り、凡例・ツールチップの設定を持たない', async () => {
    const { buildChartOptions } = await loadLogic()
    const options = buildChartOptions(false)
    expect(options).toMatchObject({
      animation: false,
      events: [],
      scales: { x: { display: false, offset: false }, y: { display: false } },
    })
    expect(options.plugins).toBeUndefined()
  })

  test('1 点のときだけ x 軸の offset で点を中央へ寄せる', async () => {
    const { buildChartOptions } = await loadLogic()
    expect(buildChartOptions(true).scales?.x).toMatchObject({ offset: true })
  })
})
