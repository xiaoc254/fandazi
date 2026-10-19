// 「换一批」级别的近期菜品池：避免连续抽取出现同一道菜（如反复出现麻辣烫）。
// 与 history（保存「就吃这个了」的）不同，这个池子会在每次推荐时自动追加，
// 既作为推荐打分时的软降权，也作为硬过滤候选（候选池足够时跳过这些 id；
// 太小才允许重复，由调用方决定是否提示）。

const KEY = "chishenme.recentPool.v2";
const MAX = 60; // 保留最近 60 个菜 id，约覆盖 10 次以上的换一批

// 会话级（内存）Ban：比 localStorage 更激进，只在当前 tab/session 生效。
// 解决即使未开启「不吃重复的」，同一会话里反复抽到同一道菜（如黑椒牛肉 4 次）的问题。
const SESSION_MAX = 24;
const sessionBan: string[] = [];

import { readJSON, writeJSON } from "./storage";

export function loadRecentPool(): string[] {
  return readJSON<string[]>(KEY, []);
}

export function recentPoolSet(limit?: number): Set<string> {
  const list = loadRecentPool();
  const out = new Set(typeof limit === "number" ? list.slice(0, limit) : list);
  // 把会话级 ban 合并进来，让推荐始终避免它们（候选足够时）
  for (const id of sessionBan) out.add(id);
  return out;
}

/** 把一批菜品 id 追加到池头部（最新在前）。同时推入会话级 ban。 */
export function pushRecent(ids: string[]): void {
  if (ids.length === 0) return;
  // 会话级：最新在前，去重截断
  for (const id of ids) {
    const idx = sessionBan.indexOf(id);
    if (idx >= 0) sessionBan.splice(idx, 1);
    sessionBan.unshift(id);
  }
  if (sessionBan.length > SESSION_MAX) sessionBan.length = SESSION_MAX;
  // 持久化：同一 id 去重保留头部
  const cur = loadRecentPool();
  const next = [...ids];
  for (const id of cur) {
    if (next.includes(id)) continue;
    next.push(id);
    if (next.length >= MAX) break;
  }
  writeJSON(KEY, next.slice(0, MAX));
}

/** 仅写入会话级 ban（不落地）。用于 swap 临时强排除。 */
export function banInSession(ids: string[]): void {
  for (const id of ids) {
    const idx = sessionBan.indexOf(id);
    if (idx >= 0) sessionBan.splice(idx, 1);
    sessionBan.unshift(id);
  }
  if (sessionBan.length > SESSION_MAX) sessionBan.length = SESSION_MAX;
}

export function sessionBanSet(): Set<string> {
  return new Set(sessionBan);
}

export function clearRecentPool(): void {
  writeJSON(KEY, []);
  sessionBan.length = 0;
}
