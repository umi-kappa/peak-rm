import { dedupeHistoryByDayLatest } from '@/core/sessionHistory'
import { db } from '@/storage/db'
import type { Exercise, SetResult, Session } from '@/core/types'

/**
 * セッションを新規保存する。呼び出し側が id・status='aborted' 込みで組み立てた
 * Session をそのまま保存する（保守的デフォルト）。重複 id は add が例外を投げる。
 */
async function insert(session: Session): Promise<void> {
  await db.sessions.add(session)
}

/** セット完了ごとの増分保存。results 配列を全置換する。 */
async function patchResults(id: string, results: SetResult[]): Promise<void> {
  await db.sessions.update(id, { results })
}

/**
 * 最終セット完了時の確定。results と status='executed' を 1 update で同時に書き込み、
 * 「results は最終だが status は aborted」という中間状態を構造的に排除する。
 */
async function finalize(id: string, results: SetResult[]): Promise<void> {
  await db.sessions.update(id, { results, status: 'executed' })
}

/** 当該 1 件のみ削除する（menuPresets には影響しない）。 */
async function remove(id: string): Promise<void> {
  await db.sessions.delete(id)
}

/** 全セッションを startedAt 降順で返す（履歴一覧の生データ）。 */
async function list(): Promise<Session[]> {
  return db.sessions.orderBy('startedAt').reverse().toArray()
}

/** 履歴一覧用。同日同種目は最新 1 件に集約した降順リストを返す。 */
async function listForHistory(): Promise<Session[]> {
  return dedupeHistoryByDayLatest(await list())
}

/**
 * 同一種目の直前セッション（startedAt 最大）を返す。無ければ undefined。
 * ステータスで絞らない（ホーム表示・progression 双方で使い、executed 判定は呼び出し側）。
 */
async function latestByExercise(exercise: Exercise): Promise<Session | undefined> {
  const sessions = await db.sessions.where('exercise').equals(exercise).sortBy('startedAt')
  return sessions.at(-1)
}

export const sessionRepo = {
  insert,
  patchResults,
  finalize,
  remove,
  list,
  listForHistory,
  latestByExercise,
}
