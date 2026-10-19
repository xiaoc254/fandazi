// 反馈按钮组：喜欢 / 不喜欢 (+ 可选「收藏」)。
// 即时反馈：点了之后按钮立刻变高亮，状态写入本地反馈库。
// 用 size="xs" 风格，避免覆盖卡片原本的视觉。

import { Heart, ThumbsUp, ThumbsDown } from "lucide-react";
import { useReactions } from "@/hooks/useReactions";
import type { ReactionKind } from "@/lib/reactions";

interface Props {
  kind: ReactionKind;
  id: string;
  /** 是否额外显示「收藏」（仅菜品 dish 用，复用现有 favorites） */
  favorite?: boolean;
  onToggleFavorite?: () => void;
  /** 紧凑版（去掉文字标签） */
  compact?: boolean;
  className?: string;
}

export function ReactionButtons({
  kind,
  id,
  favorite,
  onToggleFavorite,
  compact,
  className,
}: Props) {
  const { getStatus, like, dislike } = useReactions(kind);
  const status = getStatus(id);

  return (
    <div
      data-testid={`reactions-${kind}-${id}`}
      className={`inline-flex items-center gap-1 ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); like(id); }}
        aria-pressed={status === "like"}
        aria-label={status === "like" ? "取消喜欢" : "喜欢，多推这种"}
        data-testid={`reactions-like-${kind}-${id}`}
        className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[11.5px] transition-colors ${
          status === "like"
            ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "border-border bg-card/50 text-foreground/70 hover:border-emerald-500/40 hover:text-emerald-700"
        }`}
      >
        <ThumbsUp className="h-3 w-3" />
        {!compact && <span>喜欢</span>}
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); dislike(id); }}
        aria-pressed={status === "dislike"}
        aria-label={status === "dislike" ? "取消不喜欢" : "不喜欢，少推这种"}
        data-testid={`reactions-dislike-${kind}-${id}`}
        className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[11.5px] transition-colors ${
          status === "dislike"
            ? "border-rose-500/60 bg-rose-500/15 text-rose-600 dark:text-rose-300"
            : "border-border bg-card/50 text-foreground/70 hover:border-rose-500/40 hover:text-rose-600"
        }`}
      >
        <ThumbsDown className="h-3 w-3" />
        {!compact && <span>不喜欢</span>}
      </button>
      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          aria-pressed={!!favorite}
          aria-label={favorite ? "取消收藏" : "收藏"}
          data-testid={`reactions-fav-${kind}-${id}`}
          className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[11.5px] transition-colors ${
            favorite
              ? "border-rose-400/70 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-200"
              : "border-border bg-card/50 text-foreground/70 hover:border-rose-400/50 hover:text-rose-600"
          }`}
        >
          <Heart className={`h-3 w-3 ${favorite ? "fill-current" : ""}`} />
          {!compact && <span>{favorite ? "已收藏" : "收藏"}</span>}
        </button>
      )}
    </div>
  );
}
