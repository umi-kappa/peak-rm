import { beforeEach, expect, test, vi } from 'vitest'
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'

const router = { back: vi.fn(), replace: vi.fn() }
vi.mock('vue-router', () => ({ useRouter: () => router }))

beforeEach(() => {
  vi.clearAllMocks()
})

test('アプリ内履歴があればブラウザバックで戻る', () => {
  history.replaceState({ back: '/' }, '')
  useBackNavigation().goBack()
  expect(router.back).toHaveBeenCalledOnce()
  expect(router.replace).not.toHaveBeenCalled()
})

test('アプリ内履歴が無ければ既定の home へ replace で逃がす', () => {
  // Vue Router 未通過の直リンク相当（state.back が無い）
  history.replaceState({}, '')
  useBackNavigation().goBack()
  expect(router.replace).toHaveBeenCalledWith({ name: 'home' })
  expect(router.back).not.toHaveBeenCalled()
})

test('fallback を指定するとそこへ replace で逃がす', () => {
  history.replaceState({}, '')
  useBackNavigation({ name: 'history' }).goBack()
  expect(router.replace).toHaveBeenCalledWith({ name: 'history' })
})
