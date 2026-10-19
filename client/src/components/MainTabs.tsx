// 主 Tab 导航：5 个清晰一级入口，减少认知负担。
// 旧的 11+ 个并列入口收纳进首页「更多能力」分组卡片 + 各分组面板内部的快捷入口。
//
// v11：从 14 个并列 Tab 收纳为 5 个一级分组。所有旧 hash 路由（#/lazy / #/weekly /
// #/fridge / #/leftover / #/takeout / #/snacks / #/fruit / #/travel / #/hotboard /
// #/family-tonight / #/solo）仍然可达，仅是不再出现在顶部导航条上。

import { useEffect } from "react";
import {
  Sparkles,
  HeartPulse,
  Search,
  Coffee,
  UsersRound,
} from "lucide-react";

export type MainTabId =
  | "home"
  | "weekly"
  | "lazy"
  | "solo"
  | "health"
  | "search"
  | "travel"
  | "takeout"
  | "snacks"
  | "fruit"
  | "companion"
  | "hotboard"
  | "family"
  | "family-tonight"
  | "fridge"
  | "leftover"
  | "tonight-plan"
  | "shopping";

export interface MainTabDef {
  id: MainTabId;
  label: string;
  hint: string;
  icon: typeof Sparkles;
}

// 一级导航：5 个清晰入口。
// - home：一键决定（含 solo / family-tonight / lazy 入口卡片）
// - family：家庭厨房（含 fridge / leftover / weekly 入口卡片）
// - search：想吃什么（含 takeout / snacks / fruit / travel 入口卡片）
// - health：健康饮食（一周菜单等也从这里进入）
// - companion：生活陪伴（含 hotboard 入口卡片）
export const PRIMARY_TABS: MainTabDef[] = [
  { id: "home", label: "一键决定", hint: "今晚吃啥", icon: Sparkles },
  { id: "family", label: "家庭厨房", hint: "口味·冰箱·剩菜", icon: UsersRound },
  { id: "search", label: "想吃什么", hint: "菜谱·外卖·零食", icon: Search },
  { id: "health", label: "健康饮食", hint: "低糖·低盐·一周菜单", icon: HeartPulse },
  { id: "companion", label: "生活陪伴", hint: "饭桌·热榜·话题", icon: Coffee },
];

// 兼容旧引用：MAIN_TABS 仍然导出，但只含一级入口。
export const MAIN_TABS = PRIMARY_TABS;

const PRIMARY_IDS = new Set<MainTabId>(PRIMARY_TABS.map((t) => t.id));

// 所有合法 Tab ID（一级入口 + 旧的二级 hash 路由）。
const ALL_TAB_IDS: readonly MainTabId[] = [
  "home",
  "weekly",
  "lazy",
  "solo",
  "health",
  "search",
  "travel",
  "takeout",
  "snacks",
  "fruit",
  "companion",
  "hotboard",
  "family",
  "family-tonight",
  "fridge",
  "leftover",
  "tonight-plan",
  "shopping",
];

// 子路由 → 一级分组（用于顶部导航高亮）。
// 注意：home / solo / lazy / family-tonight 都属于「一键决定」(home)；
// 但 family-tonight 同时在 family 子导航里出现，作为「一家人今晚饭」入口。
// 这里以 family-tonight 归到 family 分组（用户最常从家庭厨房子导航进入），
// 避免点击「一家人今晚饭」后顶部一级仍高亮「一键决定」造成困惑。
export function primaryGroupOf(id: MainTabId): MainTabId {
  switch (id) {
    case "home":
    case "solo":
    case "lazy":
    case "tonight-plan":
      return "home";
    case "family":
    case "family-tonight":
    case "fridge":
    case "leftover":
    case "weekly":
    case "shopping":
      return "family";
    case "search":
    case "takeout":
    case "snacks":
    case "fruit":
    case "travel":
      return "search";
    case "health":
      return "health";
    case "companion":
    case "hotboard":
      return "companion";
    default:
      return "home";
  }
}

const HASH_PREFIX = "#/";

function hashToTab(hash: string): MainTabId | null {
  if (hash === "" || hash === "#" || hash === "#/") return "home";
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const id = hash.slice(HASH_PREFIX.length);
  if (ALL_TAB_IDS.includes(id as MainTabId)) return id as MainTabId;
  return null;
}

export function loadTabFromHash(): MainTabId {
  if (typeof window === "undefined") return "home";
  const fromHash = hashToTab(window.location.hash);
  if (typeof window !== "undefined") {
    const h = window.location.hash;
    if (h === "" || h === "#" || h === "#/") {
      try {
        window.history.replaceState(null, "", `${HASH_PREFIX}home`);
      } catch {}
    }
  }
  return fromHash ?? "home";
}

interface Props {
  active: MainTabId;
  onChange: (id: MainTabId) => void;
}

/** 顶部主导航：仅 5 个一级入口。
 *  - 移动端 (<640px)：5 列均分，按钮高 h-12，主标题清晰可读。
 *  - sm+：按钮高 h-14，主标题 + 副标题两行。
 *  - 普通文档流，不 sticky / fixed，避免遮挡内容。
 */
export function MainTabsNav({ active, onChange }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHashChange = () => {
      const next = hashToTab(window.location.hash);
      if (next && next !== active) onChange(next);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [active, onChange]);

  function handleClick(id: MainTabId) {
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `${HASH_PREFIX}${id}`);
    }
    onChange(id);
    setTimeout(() => {
      const el = document.getElementById("tab-content-anchor");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  }

  // 当前激活的一级分组：把任何子路由映射到它所属的一级分组（仅用于顶部高亮）。
  const highlightId: MainTabId = PRIMARY_IDS.has(active)
    ? active
    : primaryGroupOf(active);

  return (
    <nav
      aria-label="主导航"
      data-testid="main-tabs"
      className="relative z-10 -mx-4 mt-1 border-y border-border/50 bg-background sm:-mx-6"
    >
      <div className="mx-auto px-2 py-2.5 sm:px-3" data-testid="main-tabs-grid">
        <div
          data-testid="main-tabs-row"
          className="main-tabs-row"
          style={{
            ["--tab-cols" as any]: PRIMARY_TABS.length,
          }}
        >
          {PRIMARY_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === highlightId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleClick(t.id)}
                data-testid={`tab-${t.id}`}
                aria-current={isActive ? "page" : undefined}
                title={`${t.label} · ${t.hint}`}
                className={`group inline-flex h-12 select-none items-center justify-center gap-1.5 overflow-hidden rounded-xl border px-2 text-[14px] font-semibold tracking-tight transition-all hover-elevate active-elevate-2 sm:h-14 sm:px-2.5 ${
                  isActive
                    ? "border-primary/60 bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]"
                    : "border-border/70 bg-card/70 text-foreground/90"
                }`}
              >
                <Icon
                  className={`h-4 w-4 flex-shrink-0 sm:h-[17px] sm:w-[17px] ${
                    isActive ? "" : "text-primary"
                  }`}
                />
                <span className="flex min-w-0 flex-col items-start leading-tight">
                  <span className="block truncate whitespace-nowrap">{t.label}</span>
                  <span
                    className={`hidden truncate whitespace-nowrap text-[10.5px] font-normal sm:block ${
                      isActive ? "text-primary-foreground/85" : "text-muted-foreground"
                    }`}
                  >
                    {t.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-center text-[10.5px] text-muted-foreground/80 sm:hidden">
          5 个分组 · 更多能力到首页底部「更多能力」找
        </p>
      </div>
    </nav>
  );
}
