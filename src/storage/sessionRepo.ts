import Dexie from 'dexie'
import type { InjectionKey } from 'vue'

import { isComplete } from '@/core/session'
import { db } from '@/storage/db'
import type { Exercise, SetResult, Session } from '@/core/types'

/**
 * セッションを新規保存する。最初のセット完了時に、呼び出し側が実績（results.length >= 1）込みで
 * 組み立てた Session をそのまま保存する（開始時には insert しない）。重複 id は add が例外を投げる。
 * 空の results は不変条件「DB には実績のあるセッションしか存在しない」に反するため、
 * 書き込み境界で拒否する（patchResults の不在 id throw と同じく、規約違反をサイレントに通さない）。
 */
async function insert(session: Session): Promise<void> {
  if (session.results.length === 0) throw new Error(`session has no results: ${session.id}`)
  await db.sessions.add(session)
}

/**
 * セット完了ごとの増分保存。results 配列を全置換する。
 * 空の results は insert と同じ不変条件（実績のあるセッションのみ保存）に反するため書き込み境界で拒否する。
 * 対象 id が無ければ update は 0 件 no-op になるため、サイレントな実績喪失を防ぐべく例外を投げる。
 */
async function patchResults(id: string, results: SetResult[]): Promise<void> {
  if (results.length === 0) throw new Error(`results must not be empty: ${id}`)
  const updated = await db.sessions.update(id, { results })
  if (updated === 0) throw new Error(`session not found: ${id}`)
}

/**
 * 当該 1 件のみ削除する。
 * 意図的に冪等: 不在 id でも Dexie の delete は no-op で例外を投げない
 * （patchResults の「実績喪失を防ぐ throw」とは非対称だが、削除は
 * 「最終的に存在しない」が目的のため不在を成功扱いにするのが正しい）。
 */
async function remove(id: string): Promise<void> {
  await db.sessions.delete(id)
}

/** 当該 1 件を id で取得する。無ければ undefined（履歴経由の結果確認画面のロード用）。 */
async function get(id: string): Promise<Session | undefined> {
  return db.sessions.get(id)
}

/**
 * 全セッションを startedAt 降順で返す。
 * 同日同種目でも集約しない（履歴一覧は実績の台帳であり、全レコードが削除導線へ到達できる必要がある）。
 */
async function list(): Promise<Session[]> {
  return db.sessions.orderBy('startedAt').reverse().toArray()
}

/**
 * 同一種目の直前セッション（startedAt 最大）を返す。無ければ undefined。
 * 完遂で絞らない（ホーム表示・progression 双方で使い、完遂判定は呼び出し側）。
 * [exercise+startedAt] 複合 index の範囲末尾を DB 側で 1 件取得する（全件展開しない）。
 */
async function latestByExercise(exercise: Exercise): Promise<Session | undefined> {
  return db.sessions
    .where('[exercise+startedAt]')
    .between([exercise, Dexie.minKey], [exercise, Dexie.maxKey])
    .last()
}

/**
 * 同一種目で startedAt より前の直近の完遂セッションを返す。無ければ undefined。
 * 結果確認画面の前回比 delta 用。当該セッションは DB へ保存済みのため、
 * latestByExercise では自分自身が返ってしまう（上限排他の範囲で自分を除外する）。
 * 完遂の filter は index に乗らないが、走査は範囲末尾からの後方 1 件探索で済む。
 */
async function latestCompleteBefore(
  exercise: Exercise,
  startedAt: number,
): Promise<Session | undefined> {
  return db.sessions
    .where('[exercise+startedAt]')
    .between([exercise, Dexie.minKey], [exercise, startedAt], true, false)
    .filter(isComplete)
    .last()
}

export const sessionRepo = {
  insert,
  patchResults,
  remove,
  get,
  list,
  latestByExercise,
  latestCompleteBefore,
}

export type SessionRepo = typeof sessionRepo

// 画面は sessionRepo を直接 import せず、main.ts が app.provide したものを inject で受ける。
// Storybook が provide decorator で fake repo に差し替えられるようにするため。
// InjectionKey は型 only import なので、storage 層に Vue のランタイム依存は生じない
export const sessionRepoInjectionKey: InjectionKey<SessionRepo> = Symbol('sessionRepo')
