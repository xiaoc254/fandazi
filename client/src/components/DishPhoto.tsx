// 菜品「真实示意图」组件：
//  - 优先尝试 Wikimedia / TheMealDB 拉真实图片；
//  - 加载中或失败时回落到本地渲染氛围图（DishImage）。
//  - 图片标注「来自公开图库 · 示意图」，明确告知用户。
//  - onError 时立刻 fallback，绝不破图。

import { useState } from "react";
import { DishImage } from "@/components/DishImage";
import type { DishVisual } from "@/lib/dishVisual";
import { useDishPhoto } from "@/hooks/useDishPhoto";

interface Props {
  name: string;
  visual: DishVisual;
  alt: string;
  className?: string;
  /** 大图模式（详情页头部） */
  large?: boolean;
  /** 是否显示菜名覆盖（默认大图显示） */
  showName?: boolean;
  /** 是否启用真实图片（false → 直接走 DishImage） */
  enabled?: boolean;
  /** 是否显示来源水印（默认大图显示） */
  showSourceBadge?: boolean;
}

export function DishPhoto({
  name,
  visual,
  alt,
  className,
  large,
  showName,
  enabled = true,
  showSourceBadge,
}: Props) {
  const photo = useDishPhoto(name, enabled);
  const [imgError, setImgError] = useState(false);
  const showRealImage = photo.state === "loaded" && !imgError;

  // 关键：始终把 DishImage 渲染在底层，作为图片加载/失败时的占位与 fallback。
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <DishImage
        visual={visual}
        alt={alt}
        className="absolute inset-0 h-full w-full"
        large={large}
        showName={showName}
        showBadge={!showRealImage && (showSourceBadge ?? large)}
        name={name}
      />
      {showRealImage && (
        <>
          <img
            src={photo.url}
            alt={alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover"
            data-testid="dish-photo-real"
          />
          {/* 大图：底部菜名带渐变叠层；小图：右上角小角标。 */}
          {large && showName !== false && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-3 pt-6">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.6) 100%)",
                }}
              />
              <div className="relative font-display text-[1.3rem] leading-tight text-white drop-shadow-md sm:text-[1.55rem]">
                {name}
              </div>
            </div>
          )}
          {(showSourceBadge ?? large) && (
            <span
              className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur-sm"
              data-testid="dish-photo-source"
            >
              {photo.source === "wikimedia" ? "图库 · 示意图" : "公开图 · 示意图"}
            </span>
          )}
        </>
      )}
    </div>
  );
}
