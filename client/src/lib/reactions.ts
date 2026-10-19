// 用户反馈记录：收藏 / 喜欢 / 不喜欢。
// 与现有 favorites（chishenme.favorites.v1）兼容并复用，但增加 like / dislike 维度，
// 让推荐侧能感知「这道菜很受欢迎」「这道菜不喜欢」。
//
// 数据全部本地（localStorage 不可用时退回内存态）。
//
// 所有 setter 都是即时持久化 + 触发自定义事件，方便其它组件 subscribe。

import { readJSON, writeJSON } from "./storage";

export type ReactionKind = "dish" | "snack" | "fruit" | "takeout";
export type ReactionVerb = "like" | "dislike";

interface ReactionStore {
  /** key 形如 `${kind}:${id}` */
  likes: string[];
  dislikes: string[];
  /** 最近一次更新（ms） */
  updatedAt: number;
}

const KEY = "chishenme.reactions.v1";
const EVT = "chishenme:reactions";

let cache: ReactionStore | null = null;

function load(): ReactionStore {
  if (cache) return cache;
  cache = readJSON<ReactionStore>(KEY, { likes: [], dislikes: [], updatedAt: 0 });
  return cache!;
}

function persist(s: ReactionStore): void {
  cache = { ...s, updatedAt: Date.now() };
  writeJSON(KEY, cache);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(EVT, { detail: { kind: "all" } }));
    } catch {}
  }
}

function k(kind: ReactionKind, id: string): string {
  return `${kind}:${id}`;
}

export function getReaction(kind: ReactionKind, id: string): ReactionVerb | null {
  const s = load();
  const key = k(kind, id);
  if (s.likes.includes(key)) return "like";
  if (s.dislikes.includes(key)) return "dislike";
  return null;
}

/** 切换喜欢：再次点击会取消；点了喜欢会自动从 dislike 移除。 */
export function toggleLike(kind: ReactionKind, id: string): ReactionVerb | null {
  const s = load();
  const key = k(kind, id);
  const next: ReactionStore = {
    ...s,
    likes: s.likes.includes(key) ? s.likes.filter((x) => x !== key) : [...s.likes, key],
    dislikes: s.dislikes.filter((x) => x !== key),
    updatedAt: Date.now(),
  };
  persist(next);
  return getReaction(kind, id);
}

/** 切换不喜欢：再次点击会取消；点了不喜欢会自动从 like 移除。 */
export function toggleDislike(kind: ReactionKind, id: string): ReactionVerb | null {
  const s = load();
  const key = k(kind, id);
  const next: ReactionStore = {
    ...s,
    dislikes: s.dislikes.includes(key) ? s.dislikes.filter((x) => x !== key) : [...s.dislikes, key],
    likes: s.likes.filter((x) => x !== key),
    updatedAt: Date.now(),
  };
  persist(next);
  return getReaction(kind, id);
}

export interface ReactionSets {
  likes: Set<string>;
  dislikes: Set<string>;
}

export function loadReactions(): ReactionSets {
  const s = load();
  return { likes: new Set(s.likes), dislikes: new Set(s.dislikes) };
}

export function reactionIdsByKind(kind: ReactionKind, verb: ReactionVerb): Set<string> {
  const s = load();
  const arr = verb === "like" ? s.likes : s.dislikes;
  const out = new Set<string>();
  const prefix = `${kind}:`;
  for (const key of arr) {
    if (key.startsWith(prefix)) out.add(key.slice(prefix.length));
  }
  return out;
}

export function reactionStats() {
  const s = load();
  return {
    likes: s.likes.length,
    dislikes: s.dislikes.length,
    updatedAt: s.updatedAt,
  };
}

export function subscribeReactions(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}

export function clearReactions(): void {
  cache = { likes: [], dislikes: [], updatedAt: Date.now() };
  writeJSON(KEY, cache);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(EVT, { detail: { kind: "all" } }));
    } catch {}
  }
}
