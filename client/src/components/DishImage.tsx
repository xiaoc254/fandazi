// 菜品「示意图」组件：
//  - 不再使用网络上的随机菜品照片：QA 反馈鸡肉菜显示 Tacos，关键词命中误差大且无法核验。
//  - 改成完全本地渲染的氛围图：渐变背景（按 course/cuisine） + 食材 emoji + 菜名覆盖 + 「示意图」角标。
//  - 不依赖网络，零破图风险，且明确告诉用户这是示意图而非实拍。

import type { DishVisual } from "@/lib/dishVisual";

interface DishImageProps {
  visual: DishVisual;
  alt: string;
  className?: string;
  /** 大图模式：用于详情页头部，emoji 更大、菜名样式更突出。 */
  large?: boolean;
  /** 显示菜名覆盖（默认大图显示，小图不显示）。 */
  showName?: boolean;
  /** 显示「示意图」角标（默认大图显示）。 */
  showBadge?: boolean;
  /** 菜名（可选；若不传则只渲染 emoji 与渐变） */
  name?: string;
}

export function DishImage({
  visual,
  alt,
  className,
  large,
  showName,
  showBadge,
  name,
}: DishImageProps) {
  const renderName = showName ?? large;
  const renderBadge = showBadge ?? large;

  // 小图模式：在 emoji 旁叠一个标题首字，让缩略图不再像「纯色 + 单一 emoji」占位块。
  const firstChar = !large && name ? (name.trim().charAt(0) || "") : "";

  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{
        background: `linear-gradient(135deg, ${visual.gradient[0]} 0%, ${visual.gradient[1]} 100%)`,
      }}
      data-testid="dish-illustration"
    >
      {/* 顶部高光，让卡片立体一些 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 28% 22%, rgba(255,255,255,0.42), transparent 58%)",
        }}
      />
      {/* 底部色带，给所有尺寸都加结构感（关键：避免 QA 看到「纯色块」） */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: large ? "30%" : "32%",
          background: `linear-gradient(180deg, transparent 0%, ${visual.accent} 100%)`,
          opacity: large ? 0.55 : 0.65,
        }}
      />
      {/* 微纹理：所有尺寸都带，避免「纯色块」感 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.85) 1px, transparent 1px)",
          backgroundSize: large ? "10px 10px" : "6px 6px",
        }}
      />
      {/* 斜向高光纹路：增加质感 */}
      {!large && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.0) 0px, rgba(255,255,255,0.0) 6px, rgba(255,255,255,0.18) 6px, rgba(255,255,255,0.18) 7px)",
          }}
        />
      )}
      {/* 主视觉：大图保留大 emoji；小图叠首字 + emoji 角标，更像「卡面」 */}
      {large ? (
        <span
          aria-hidden
          className="relative flex h-full w-full items-center justify-center text-[5.5rem] drop-shadow-sm sm:text-[6.5rem]"
        >
          {visual.emoji}
        </span>
      ) : firstChar ? (
        <>
          <span
            aria-hidden
            className="relative flex h-full w-full items-center justify-center font-display text-[1.55rem] font-semibold leading-none text-white drop-shadow-md"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
          >
            {firstChar}
          </span>
          <span
            aria-hidden
            className="absolute right-0.5 top-0.5 text-[15px] drop-shadow"
          >
            {visual.emoji}
          </span>
          {/* 菜系角标，左下角，和大图保持一致语言 */}
          <span
            aria-hidden
            className="absolute bottom-0.5 left-0.5 text-[11px] opacity-90"
          >
            {visual.badge}
          </span>
        </>
      ) : (
        <>
          <span
            aria-hidden
            className="relative flex h-full w-full items-center justify-center text-[1.75rem] drop-shadow-sm"
          >
            {visual.emoji}
          </span>
          <span
            aria-hidden
            className="absolute bottom-0.5 left-0.5 text-[11px] opacity-90"
          >
            {visual.badge}
          </span>
        </>
      )}
      {/* 菜系/类目角标 emoji，仅大图显示 */}
      {large && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-4 text-2xl opacity-85"
        >
          {visual.badge}
        </span>
      )}
      {/* 菜名覆盖：大图模式必显示，给一道明确视觉锚点 */}
      {renderName && name && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-3 pt-6">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.38) 70%, rgba(0,0,0,0.5) 100%)",
            }}
          />
          <div
            className="relative font-display text-[1.3rem] leading-tight text-white drop-shadow-md sm:text-[1.55rem]"
            data-testid="dish-illustration-name"
          >
            {name}
          </div>
        </div>
      )}
      {/* 「示意图」角标：大图默认显示。明确告诉用户不是实拍。 */}
      {renderBadge && (
        <span
          className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur-sm"
          data-testid="dish-illustration-badge"
        >
          示意图
        </span>
      )}
    </div>
  );
}
