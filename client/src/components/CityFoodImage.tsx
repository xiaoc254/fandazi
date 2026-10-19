// 旅行城市美食图片：复用 imageProvider 拉真实示意图，失败回落渐变占位。
// 与 DishPhoto 类似但更轻：城市食物没有 DishVisual，因此 fallback 是抽象渐变 + emoji。

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { useDishPhoto } from "@/hooks/useDishPhoto";

interface Props {
  /** 食物名 — 用于查询图片（建议传 `${city} ${name}` 提升命中率） */
  query: string;
  /** UI 上展示的食物名 */
  name: string;
  /** 用于占位 emoji 的提示（甜品 / 早餐 / 面食 等） */
  tag?: string;
  className?: string;
}

// 关键字 → emoji 占���（匹配命中即用，否则用通用 🍽）
const TAG_EMOJI: { keys: RegExp; emoji: string; bg: string }[] = [
  { keys: /甜品|糖|蛋糕|双皮|布丁|马卡龙/, emoji: "🍰", bg: "from-rose-200 via-amber-100 to-amber-50" },
  { keys: /饮|奶茶|咖啡|豆浆/, emoji: "🥤", bg: "from-amber-100 via-orange-100 to-rose-100" },
  { keys: /早餐|肠粉|包子|烧饼|油条|煎饼|粥/, emoji: "🌅", bg: "from-amber-100 via-yellow-100 to-orange-50" },
  { keys: /面|粉|米线|饺子|馄饨|烧麦/, emoji: "🍜", bg: "from-orange-100 via-amber-100 to-rose-100" },
  { keys: /鸡|鸭|鹅|鸽|禽/, emoji: "🍗", bg: "from-amber-200 via-orange-200 to-rose-200" },
  { keys: /火锅|涮|烫/, emoji: "🍲", bg: "from-rose-300 via-orange-200 to-amber-100" },
  { keys: /鱼|虾|蟹|海/, emoji: "🐟", bg: "from-sky-100 via-cyan-100 to-emerald-50" },
  { keys: /牛|羊|猪|肉/, emoji: "🥩", bg: "from-rose-200 via-orange-100 to-amber-100" },
  { keys: /茶|凉/, emoji: "🍵", bg: "from-emerald-100 via-amber-50 to-rose-50" },
  { keys: /烤|串|烧/, emoji: "🍢", bg: "from-orange-200 via-rose-200 to-amber-100" },
  { keys: /素|菜|蔬|豆/, emoji: "🥬", bg: "from-emerald-100 via-lime-100 to-amber-50" },
];

function pickPlaceholder(name: string, tag?: string) {
  const text = `${name} ${tag ?? ""}`;
  for (const cand of TAG_EMOJI) {
    if (cand.keys.test(text)) return cand;
  }
  return { emoji: "🍽", bg: "from-amber-100 via-orange-100 to-rose-100" };
}

export function CityFoodImage({ query, name, tag, className }: Props) {
  const photo = useDishPhoto(query, true);
  const [imgError, setImgError] = useState(false);
  const showReal = photo.state === "loaded" && !imgError;
  const ph = pickPlaceholder(name, tag);

  return (
    <div className={`relative overflow-hidden rounded-md bg-gradient-to-br ${ph.bg} ${className ?? ""}`}>
      {/* 占位层：始终在底层，确保即便图片加载中也是漂亮渐变而非空白 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[2.2rem] drop-shadow-sm" aria-hidden>
          {ph.emoji}
        </span>
      </div>
      {showReal && (
        <img
          src={photo.url}
          alt={`${name} 示意图`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="absolute inset-0 h-full w-full object-cover"
          data-testid={`city-food-img-${name}`}
        />
      )}
      {photo.state === "fallback" && imgError && (
        <span className="absolute right-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-black/30 px-1 py-0.5 text-[9px] text-white" aria-hidden>
          <ImageOff className="h-2.5 w-2.5" />
        </span>
      )}
    </div>
  );
}
