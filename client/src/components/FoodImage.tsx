// 通用「食物视觉」：复用 useDishPhoto 拉真实示意图，失败回落到「类目渐变 + emoji + 首字」。
// 用于 SnacksPanel / TakeoutPanel / LazyDecisionPanel / DecisionPoster：
//   - 不直接绑定单一类目，调用方传入 emoji / 渐变；
//   - 永远先渲染稳定的 fallback，图片加载失败 onError 立刻回落，避免破图。
//   - query 关键词建议传 `${name} ${tag}` 提高 Wikimedia 命中率；query 为空则只渲染 fallback。

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { useDishPhoto } from "@/hooks/useDishPhoto";

interface Props {
  /** 用于查 Wikimedia/TheMealDB 的关键词；不想拉真实图片就传 "" */
  query?: string;
  /** UI 展示用的食物名 */
  name: string;
  /** 兜底 emoji */
  emoji?: string;
  /** 兜底渐变 */
  gradient?: [string, string];
  className?: string;
  /** 角落标签（如「真品牌 A」「品类」） */
  badge?: string;
}

export function FoodImage({ query, name, emoji = "🍽", gradient, className, badge }: Props) {
  const enabled = !!query && query.length > 0;
  const photo = useDishPhoto(query, enabled);
  const [imgError, setImgError] = useState(false);
  const showReal = enabled && photo.state === "loaded" && !imgError;
  const grad: [string, string] = gradient ?? ["#f4a045", "#a85a2c"];
  const first = (name || "").trim().charAt(0) || emoji;

  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-sm ${className ?? ""}`}
      style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.42), transparent 60%)" }}
        aria-hidden
      />
      <span className="relative flex h-full w-full items-center justify-center font-display text-[1.85rem] font-semibold text-white drop-shadow-md">
        {first}
      </span>
      <span className="absolute right-1 top-1 text-[16px] drop-shadow" aria-hidden>{emoji}</span>
      {showReal && (
        <img
          src={photo.url}
          alt={`${name} 示意图`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="absolute inset-0 h-full w-full object-cover"
          data-testid={`food-img-${name}`}
        />
      )}
      {(photo.state === "fallback" || imgError) && enabled && (
        <span className="absolute right-1 bottom-1 inline-flex items-center gap-0.5 rounded-full bg-black/30 px-1 py-0.5 text-[9px] text-white" aria-hidden>
          <ImageOff className="h-2.5 w-2.5" />
        </span>
      )}
      {badge && (
        <span className="absolute left-1 top-1 inline-flex items-center rounded-full bg-black/35 px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-white">
          {badge}
        </span>
      )}
    </div>
  );
}

/** 给「品牌 / 商品名」生成稳定的搜索 URL（用百度站内 / 平台搜索；不依赖商家直链）。 */
export function stableSearchUrl(label: "美团" | "淘宝" | "京东" | "百度" | "饿了么" | "美团闪购", q: string): string {
  const enc = encodeURIComponent(q);
  switch (label) {
    case "美团":
      return `https://www.baidu.com/s?wd=${encodeURIComponent("site:meituan.com 外卖 " + q)}`;
    case "美团闪购":
      return `https://www.baidu.com/s?wd=${encodeURIComponent("美团闪购 " + q)}`;
    case "饿了么":
      return `https://www.baidu.com/s?wd=${encodeURIComponent("site:ele.me 外卖 " + q)}`;
    case "京东":
      return `https://search.jd.com/Search?keyword=${enc}`;
    case "淘宝":
      return `https://s.taobao.com/search?q=${enc}`;
    case "百度":
    default:
      return `https://www.baidu.com/s?wd=${enc}`;
  }
}
