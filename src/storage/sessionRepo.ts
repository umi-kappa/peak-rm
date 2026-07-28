import Dexie from 'dexie'
import type { InjectionKey } from 'vue'

import { dedupeHistoryByDay } from '@/core/sessionHistory'
import { db } from '@/storage/db'
import type { Exercise, SetResult, Session } from '@/core/types'

/**
 * セッションを新規保存する。最初のセット完了時に、呼び出し側が実績（results.length >= 1）と
 * status 込みで組み立てた Session をそのまま保存する（開始時には insert しない。
 * sets = 1 の完遂では insert 時点で executed になりうる）。重複 id は add が例外を投げる。
 * 空の results は不変条件「DB には実績のあるセッションしか存在しない」に反するため、
 * 書き込み境界で拒否する（patchResults / finalize の不在 id throw と同じく、規約違反をサイレントに通さない）。
 */
async function insert(session: Session): Promise<void> {
  if (session.results.length === 0) throw new Error(`session has no results: ${session.id}`)
  await db.sessions.add(session)
}

/**
 * セット完了ごとの増分保存。results 配列を全置換する。
 * 対象 id が無ければ update は 0 件 no-op になるため、サイレントな実績喪失を防ぐべく例外を投げる。
 */
async function patchResults(id: string, results: SetResult[]): Promise<void> {
  const updated = await db.sessions.update(id, { results })
  if (updated === 0) throw new Error(`session not found: ${id}`)
}

/**
 * results と status を 1 update で同時に書き込む。実績編集（patchResultAt）で完遂条件
 * （isComplete）の充足が変わったとき、呼び出し側が再導出した status を results と一緒に
 * 確定し、「results は更新されたが status は古い」二相不整合を構造的に排除する。
 * 対象 id が無ければ update は 0 件 no-op になるため例外を投げる（patchResults と同じ理由）。
 */
async function patchResultsAndStatus(
  id: string,
  results: SetResult[],
  status: Session['status'],
): Promise<void> {
  const updated = await db.sessions.update(id, { results, status })
  if (updated === 0) throw new Error(`session not found: ${id}`)
}

/**
 * 最終セット完了時の executed 確定。patchResultsAndStatus の executed 特化エントリで、
 * 「results は最終だが status は aborted」という中間状態を構造的に排除する。
 * results が完遂条件（isComplete）を満たすかは検証しない。呼び出し側は executed 確定時
 * （全セット完了かつ target 達成）にのみ呼ぶこと。仮に未完遂で呼ばれても、増量トリガーは
 * linearProgression 側が isComplete で再判定する。
 */
async function finalize(id: string, results: SetResult[]): Promise<void> {
  await patchResultsAndStatus(id, results, 'executed')
}

/**
 * 当該 1 件のみ削除する。
 * 意図的に冪等: 不在 id でも Dexie の delete は no-op で例外を投げない
 * （patchResults/finalize の「実績喪失を防ぐ throw」とは非対称だが、削除は
 * 「最終的に存在しない」が目的のため不在を成功扱いにするのが正しい）。
 */
async function remove(id: string): Promise<void> {
  await db.sessions.delete(id)
}

/** 当該 1 件を id で取得する。無ければ undefined（履歴経由の結果確認画面のロード用）。 */
async function get(id: string): Promise<Session | undefined> {
  return db.sessions.get(id)
}

/** 全セッションを startedAt 降順で返す（履歴一覧の生データ）。 */
async function list(): Promise<Session[]> {
  return db.sessions.orderBy('startedAt').reverse().toArray()
}

/** 履歴一覧用。同日同種目は executed 優先で 1 件に集約した降順リストを返す。 */
async function listForHistory(): Promise<Session[]> {
  return dedupeHistoryByDay(await list())
}

/**
 * 同一種目の直前セッション（startedAt 最大）を返す。無ければ undefined。
 * ステータスで絞らない（ホーム表示・progression 双方で使い、完遂判定は呼び出し側）。
 * [exercise+startedAt] 複合 index の範囲末尾を DB 側で 1 件取得する（全件展開しない）。
 */
async function latestByExercise(exercise: Exercise): Promise<Session | undefined> {
  return db.sessions
    .where('[exercise+startedAt]')
    .between([exercise, Dexie.minKey], [exercise, Dexie.maxKey])
    .last()
}

/**
 * 同一種目で startedAt より前の直近 executed セッションを返す。無ければ undefined。
 * 結果確認画面の前回比 delta 用。当該セッションは DB へ保存済みのため、
 * latestByExercise では自分自身が返ってしまう（上限排他の範囲で自分を除外する）。
 * status の filter は index に乗らないが、走査は範囲末尾からの後方 1 件探索で済む。
 */
async function latestExecutedBefore(
  exercise: Exercise,
  startedAt: number,
): Promise<Session | undefined> {
  return db.sessions
    .where('[exercise+startedAt]')
    .between([exercise, Dexie.minKey], [exercise, startedAt], true, false)
    .filter((session) => session.status === 'executed')
    .last()
}

export const sessionRepo = {
  insert,
  patchResults,
  patchResultsAndStatus,
  finalize,
  remove,
  get,
  list,
  listForHistory,
  latestByExercise,
  latestExecutedBefore,
}

export type SessionRepo = typeof sessionRepo

// 画面は sessionRepo を直接 import せず、main.ts が app.provide したものを inject で受ける。
// Storybook が provide decorator で fake repo に差し替えられるようにするため。
// InjectionKey は型 only import なので、storage 層に Vue のランタイム依存は生じない
export const sessionRepoInjectionKey: InjectionKey<SessionRepo> = Symbol('sessionRepo')
