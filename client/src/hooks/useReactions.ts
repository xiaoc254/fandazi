// Subscribe to reactions store and expose per-kind sets.
// 不直接读取 localStorage 多次：每次 subscribe 事件触发后用 loadReactions 重读一次。

import { useCallback, useEffect, useState } from "react";
import {
  loadReactions,
  reactionIdsByKind,
  subscribeReactions,
  toggleDislike,
  toggleLike,
  type ReactionKind,
  type ReactionVerb,
  getReaction,
} from "@/lib/reactions";

interface UseReactionsResult {
  /** 当前 kind 下的喜欢 id 集合 */
  likes: Set<string>;
  /** 当前 kind 下的不喜欢 id 集合 */
  dislikes: Set<string>;
  /** 单 id 的当前状态：like / dislike / null */
  getStatus: (id: string) => ReactionVerb | null;
  /** 切换喜欢，返回新状态 */
  like: (id: string) => ReactionVerb | null;
  /** 切换不喜欢，返回新状态 */
  dislike: (id: string) => ReactionVerb | null;
}

export function useReactions(kind: ReactionKind): UseReactionsResult {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const off = subscribeReactions(() => setTick((x) => x + 1));
    return off;
  }, []);

  const likes = reactionIdsByKind(kind, "like");
  const dislikes = reactionIdsByKind(kind, "dislike");

  // tick 仅用于触发刷新；上面读取已经反映最新值
  void tick;

  const getStatus = useCallback((id: string) => getReaction(kind, id), [kind]);
  const like = useCallback((id: string) => toggleLike(kind, id), [kind]);
  const dislike = useCallback((id: string) => toggleDislike(kind, id), [kind]);

  return { likes, dislikes, getStatus, like, dislike };
}

/** 全量（所有 kind）likes / dislikes — 用于全局统计 */
export function useAllReactions() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const off = subscribeReactions(() => setTick((x) => x + 1));
    return off;
  }, []);
  void tick;
  return loadReactions();
}
