import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import {
  Sparkles,
  Clock,
  ChefHat,
  RefreshCw,
  Lock,
  LockOpen,
  Copy,
  Check,
  ShoppingBasket,
  Users,
  Soup,
  Salad,
  Wheat,
  Github,
  Flame,
  Leaf,
  Info,
  AlertTriangle,
  ChevronRight,
  UserCircle2,
  Cloud,
  CalendarDays,
  Heart,
  History as HistoryIcon,
  CheckCircle2,
  Repeat,
} from "lucide-react";
import { DishDetail } from "@/components/DishDetail";
import { ProfileDialog, type ProfileTab } from "@/components/ProfileDialog";
import { Onboarding } from "@/components/Onboarding";
import { PersonaWelcome } from "@/components/PersonaWelcome";
import {
  ROLES,
  hasPersonaSetupShown,
  loadPersona,
  markPersonaSetupShown,
  personaEnergyHints,
  personaHealthFilters,
  savePersona,
  type Persona,
  type RoleId,
} from "@/lib/persona";
import { loadReactions, subscribeReactions } from "@/lib/reactions";
import { ReactionButtons } from "@/components/ReactionButtons";
import { DishImage } from "@/components/DishImage";
import { DishPhoto } from "@/components/DishPhoto";
import { dishVisual } from "@/lib/dishVisual";
import { MainTabsNav, loadTabFromHash, type MainTabId } from "@/components/MainTabs";

// 重型 / 偶尔进入的 Tab 改为 lazy import，减小首屏 bundle，不卡死
const HealthPanel = lazy(() => import("@/components/HealthPanel").then((m) => ({ default: m.HealthPanel })));
const SearchPanel = lazy(() => import("@/components/SearchPanel").then((m) => ({ default: m.SearchPanel })));
const TravelPanel = lazy(() => import("@/components/TravelPanel").then((m) => ({ default: m.TravelPanel })));
const TakeoutPanel = lazy(() => import("@/components/TakeoutPanel").then((m) => ({ default: m.TakeoutPanel })));
const CompanionPanel = lazy(() => import("@/components/CompanionPanel").then((m) => ({ default: m.CompanionPanel })));
const HotBoard = lazy(() => import("@/components/HotBoard").then((m) => ({ default: m.HotBoard })));
const SnacksPanel = lazy(() => import("@/components/SnacksPanel").then((m) => ({ default: m.SnacksPanel })));
const FruitPanel = lazy(() => import("@/components/FruitPanel").then((m) => ({ default: m.FruitPanel })));
const LazyDecisionPanel = lazy(() => import("@/components/LazyDecisionPanel").then((m) => ({ default: m.LazyDecisionPanel })));
const SoloTonightPanel = lazy(() => import("@/components/SoloTonightPanel").then((m) => ({ default: m.SoloTonightPanel })));
const FamilyTonightPanel = lazy(() => import("@/components/FamilyTonightPanel").then((m) => ({ default: m.FamilyTonightPanel })));
const TonightPlanPanel = lazy(() => import("@/components/TonightPlanPanel").then((m) => ({ default: m.TonightPlanPanel })));
const WeeklyMenuPanel = lazy(() => import("@/components/WeeklyMenuPanel").then((m) => ({ default: m.WeeklyMenuPanel })));
const FamilyPanel = lazy(() => import("@/components/FamilyPanel").then((m) => ({ default: m.FamilyPanel })));
const FridgePanel = lazy(() => import("@/components/FridgePanel").then((m) => ({ default: m.FridgePanel })));
const LeftoverPanel = lazy(() => import("@/components/LeftoverPanel").then((m) => ({ default: m.LeftoverPanel })));
const ShoppingListPanel = lazy(() => import("@/components/ShoppingListPanel").then((m) => ({ default: m.ShoppingListPanel })));
import { pushRecent, recentPoolSet, banInSession } from "@/lib/recentPool";
import { healthFilterLabel, type HealthFilterId, type IngredientWishId } from "@/lib/recommend";
import { Wordmark, Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ALL_CUISINES,
  ALL_DIFFICULTIES,
  ALL_RESTRICTIONS,
  ALL_TASTES,
  RECIPES,
  type Recipe,
} from "@/data/recipes";
import {
  DEFAULT_PREFS,
  recommend,
  buildShoppingList,
  shoppingListToText,
  planToList,
  countByCourseUnderHardOnly,
  calorieSummary,
  deriveLikedTraits,
  type MealPlan,
  type Preferences,
  type RecommendContext,
} from "@/lib/recommend";
import { perPersonCaloriesOf } from "@/lib/calories";
import {
  getActiveProfile,
  computePlan,
  SLOT_LABELS,
  syncPersonaToProfile,
  type Profile,
  type MealSlot,
} from "@/lib/profile";
import {
  loadEnv,
  saveEnv as persistEnv,
  resolveEnv,
  type EnvContext,
} from "@/lib/environment";
import {
  SCENARIOS,
  applyScenarioToPrefs,
  loadScenario,
  saveScenario,
  hasOnboarded,
  markOnboarded,
  getScenario,
  type ScenarioId,
} from "@/lib/scenarios";
import {
  loadFavorites,
  loadHistory,
  loadNoRepeat,
  recentRecipeIds,
  saveHistoryEntry,
  saveNoRepeat,
  toggleFavorite,
  type HistoryEntry,
} from "@/lib/history";
import { applyMealTheme, MEAL_THEMES } from "@/lib/mealTheme";
import type { CompanionContext } from "@/lib/companionRecommend";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { CloudSyncDialog } from "@/components/CloudSyncDialog";
import { isConfigured as isCloudConfigured } from "@/lib/cloudSync";
import { TodayDock } from "@/components/TodayDock";
import {
  PAGE_SIZES,
  applyPageSize,
  loadPageSize,
  savePageSize,
  type PageSizeId,
} from "@/lib/pageSize";
import {
  THEMES,
  applyTheme,
  loadTheme,
  saveTheme,
  type ThemeId,
} from "@/lib/theme";
import { Palette } from "lucide-react";
import { Type as TypeIcon } from "lucide-react";

// === 小工具组件 ===
function Chip({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors hover-elevate active-elevate-2 ${
        active
          ? "border-primary/50 bg-primary text-primary-foreground"
          : "border-border bg-card/60 text-foreground/80"
      }`}
    >
      {children}
    </button>
  );
}

function SectionTitle({
  num,
  title,
  hint,
}: {
  num: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <span className="font-display text-[15px] text-primary num">{num}</span>
      <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      {hint && <span className="ml-auto text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

function CourseIcon({ course, className }: { course: string; className?: string }) {
  if (course === "main") return <ChefHat className={className} aria-hidden />;
  if (course === "soup") return <Soup className={className} aria-hidden />;
  if (course === "veggie") return <Salad className={className} aria-hidden />;
  return <Wheat className={className} aria-hidden />;
}

const COURSE_LABEL: Record<string, string> = {
  main: "主菜",
  veggie: "素菜",
  soup: "汤",
  staple: "主食",
};

const WISH_OPTIONS: { id: IngredientWishId; label: string; emoji: string }[] = [
  { id: "beef", label: "牛肉", emoji: "🥩" },
  { id: "pork", label: "猪肉", emoji: "🥓" },
  { id: "chicken", label: "鸡肉", emoji: "🍗" },
  { id: "seafood", label: "鱼虾", emoji: "🍤" },
  { id: "tofu", label: "豆腐", emoji: "🟦" },
  { id: "vegetable", label: "蔬菜", emoji: "🥬" },
  { id: "noodle", label: "面食", emoji: "🍜" },
  { id: "rice", label: "米饭", emoji: "🍚" },
  { id: "dessert", label: "甜品", emoji: "🍰" },
];

function DifficultyDots({ d }: { d: "简单" | "中等" | "进阶" }) {
  const n = d === "简单" ? 1 : d === "中等" ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`难度 ${d}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i < n ? "bg-primary" : "bg-muted-foreground/25"
          }`}
        />
      ))}
    </span>
  );
}

// === 菜品卡片 ===
function DishCard({
  recipe,
  locked,
  favorite,
  onToggleLock,
  onSwap,
  onOpenDetail,
  onToggleFavorite,
  targetMealCal,
  realImagesEnabled,
}: {
  recipe: Recipe;
  locked: boolean;
  favorite: boolean;
  onToggleLock: () => void;
  onSwap: () => void;
  onOpenDetail: () => void;
  onToggleFavorite: () => void;
  /** 当前餐次目标人均热量，启用饮食计划时显示对比 */
  targetMealCal?: number;
  realImagesEnabled?: boolean;
}) {
  const visual = dishVisual(recipe.name, recipe.course, recipe.cuisine);
  const perPerson = targetMealCal ? perPersonCaloriesOf(recipe) : 0;
  return (
    <Card className="grain animate-rise relative overflow-hidden border-card-border/60 bg-card/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenDetail}
            data-testid={`thumb-recipe-${recipe.id}`}
            aria-label={`查看 ${recipe.name} 详情`}
            className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl shadow-sm transition-transform hover:scale-[1.04] active:scale-[0.98]"
          >
            {realImagesEnabled ? (
              <DishPhoto
                name={recipe.name}
                visual={visual}
                alt={`${recipe.name} 示意图`}
                className="h-full w-full"
                showSourceBadge={false}
              />
            ) : (
              <DishImage visual={visual} alt={`${recipe.name} 示意图`} className="h-full w-full" name={recipe.name} />
            )}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display text-[1.15rem] tracking-tight" data-testid={`text-recipe-${recipe.id}`}>
                {recipe.name}
              </h4>
              <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                <CourseIcon course={recipe.course} className="mr-1 h-2.5 w-2.5" />
                {COURSE_LABEL[recipe.course]}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 num">
                <Clock className="h-3 w-3" /> 约 {recipe.timeMinutes} 分钟
              </span>
              <span className="inline-flex items-center gap-1">
                <DifficultyDots d={recipe.difficulty} /> {recipe.difficulty}
              </span>
              <span className="hidden sm:inline">{recipe.cuisine}</span>
            </div>
          </div>
        </div>
        {/* 收藏（爱心）单独成块，与右侧操作按钮保持一段间距，避免移动端误触 */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onToggleFavorite}
            data-testid={`button-fav-${recipe.id}`}
            aria-label={favorite ? "取消收藏" : "收藏这道菜"}
            className={`h-9 w-9 rounded-full border ${
              favorite
                ? "border-rose-300/70 bg-rose-50/70"
                : "border-border/60 bg-card/40"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${favorite ? "fill-rose-500 text-rose-500" : ""}`}
            />
          </Button>
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card/40 p-0.5">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onToggleLock}
              data-testid={`button-lock-${recipe.id}`}
              aria-label={locked ? "解锁这道菜" : "锁定这道菜"}
              className="h-7 w-7"
            >
              {locked ? (
                <Lock className="h-4 w-4 text-primary" />
              ) : (
                <LockOpen className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onSwap}
              data-testid={`button-swap-${recipe.id}`}
              aria-label="只换这一道"
              className="h-7 w-7"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/80">
        <Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary/80" />
        {recipe.reason}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {recipe.tastes.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className="rounded-full bg-accent/60 px-2 py-0 text-[11px] text-accent-foreground"
          >
            {(t === "麻辣" || t === "重辣" || t === "微辣") && (
              <Flame className="mr-0.5 h-2.5 w-2.5" />
            )}
            {t === "清淡" && <Leaf className="mr-0.5 h-2.5 w-2.5" />}
            {t}
          </Badge>
        ))}
      </div>

      {targetMealCal && perPerson > 0 && (
        <div
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11.5px] text-primary num"
          data-testid={`chip-calorie-${recipe.id}`}
        >
          <Flame className="h-3 w-3" />
          人均 {perPerson} kcal · 餐次目标 {targetMealCal} kcal
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <ReactionButtons kind="dish" id={recipe.id} compact />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenDetail}
          data-testid={`button-detail-${recipe.id}`}
          className="h-9 flex-1 justify-between rounded-full border-primary/30 bg-primary/5 text-[13px] text-primary hover:bg-primary/10"
        >
          <span className="inline-flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            查看详情
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

// 二级入口：5 个一级分组下属的子模块。点击切换 tab + 同步 hash。
const SUB_GROUPS: Record<string, { id: MainTabId; label: string; emoji: string }[]> = {
  family: [
    { id: "family", label: "家庭口味", emoji: "👨‍👩‍👧" },
    { id: "family-tonight", label: "今晚饭", emoji: "🍲" },
    { id: "fridge", label: "冰箱有啥", emoji: "🧊" },
    { id: "leftover", label: "剩菜变花样", emoji: "♻️" },
    { id: "weekly", label: "一周菜单", emoji: "🗓️" },
    { id: "shopping", label: "购物清单", emoji: "🛒" },
  ],
  search: [
    { id: "search", label: "菜谱搜索", emoji: "🔍" },
    { id: "takeout", label: "外卖", emoji: "🛵" },
    { id: "snacks", label: "零食", emoji: "🍪" },
    { id: "fruit", label: "水果", emoji: "🍎" },
    { id: "travel", label: "旅行美食", emoji: "✈️" },
  ],
  health: [
    { id: "health", label: "健康饮食", emoji: "🥗" },
    { id: "weekly", label: "一周菜单", emoji: "🗓️" },
  ],
  companion: [
    { id: "companion", label: "饭桌陪伴", emoji: "☕" },
    { id: "hotboard", label: "饭桌热榜", emoji: "🔥" },
  ],
  decide: [
    { id: "solo", label: "一个人", emoji: "🧍" },
    { id: "family-tonight", label: "一家人", emoji: "👨‍👩‍👧" },
    { id: "lazy", label: "懒人决定", emoji: "🪄" },
    { id: "tonight-plan", label: "今晚最终方案", emoji: "✨" },
  ],
};

function groupOf(id: MainTabId): keyof typeof SUB_GROUPS | null {
  if (id === "family" || id === "family-tonight" || id === "fridge" || id === "leftover" || id === "weekly" || id === "shopping") return "family";
  if (id === "search" || id === "takeout" || id === "snacks" || id === "fruit" || id === "travel") return "search";
  if (id === "health") return "health";
  if (id === "companion" || id === "hotboard") return "companion";
  if (id === "solo" || id === "lazy" || id === "tonight-plan") return "decide";
  return null;
}

function SubNav({ active, onChange }: { active: MainTabId; onChange: (id: MainTabId) => void }) {
  const g = groupOf(active);
  if (!g) return null;
  const items = SUB_GROUPS[g];
  return (
    <nav
      aria-label="二级入口"
      data-testid={`sub-nav-${g}`}
      className="-mx-2 mb-4 flex gap-2 overflow-x-auto px-2 pb-1"
    >
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            data-testid={`sub-nav-item-${it.id}`}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex h-10 flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors hover-elevate active-elevate-2 ${
              isActive
                ? "border-primary/60 bg-primary text-primary-foreground"
                : "border-border/70 bg-card/70 text-foreground/85"
            }`}
          >
            <span aria-hidden className="text-base">{it.emoji}</span>
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// === Hero 右侧智能推荐卡：本地渲染的浮动卡 + 微数据仪表 + 快捷跳转 ===
// 不依赖远程图片，统一陶红/暖橙色调；移动端隐藏，lg+ 浮现在 Hero 右侧。
function SmartHeroCard({
  meal,
  recipeCount,
  env,
  scenarioLabel,
  scenarioEmoji,
  targetMealCalories,
  onJumpHot,
  onJumpCategories,
}: {
  meal: { label: string; emoji: string; toneHint: string; description: string };
  recipeCount: number;
  env: EnvContext;
  scenarioLabel: string;
  scenarioEmoji: string;
  targetMealCalories?: number;
  onJumpHot: () => void;
  onJumpCategories: () => void;
}) {
  const dateStr = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const weatherText =
    env.weather && env.weather !== "未指定" ? env.weather : "天气未设";
  const placeText =
    env.city || env.province || (env.region && env.region !== "未指定" ? env.region : "—");
  const tempText = typeof env.temperatureC === "number" ? `${env.temperatureC}°C` : "";

  return (
    <aside
      aria-label="今日智能推荐卡"
      data-testid="smart-hero-card"
      className="relative hidden lg:block"
    >
      {/* 装饰光晕 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] opacity-70 blur-2xl"
        style={{
          background:
            "radial-gradient(50% 60% at 70% 30%, rgba(244,160,69,0.28), transparent 60%)," +
            " radial-gradient(60% 70% at 30% 80%, rgba(193,75,42,0.20), transparent 70%)",
        }}
      />
      {/* 主卡 */}
      <div
        className="grain relative overflow-hidden rounded-2xl border border-primary/20 bg-card/85 p-5 shadow-xl shadow-primary/10 backdrop-blur"
      >
        {/* 顶部色带 */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1.5"
          style={{
            background:
              "linear-gradient(90deg, #f4a045 0%, #c84e22 50%, #8b3a18 100%)",
          }}
        />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-primary/80">
              今日智能推荐
            </p>
            <p className="mt-1 num text-[12px] text-muted-foreground">{dateStr}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
            <span aria-hidden className="text-base">{meal.emoji}</span>
            {meal.label}
          </span>
        </div>

        {/* 抽象餐盘图形 */}
        <div className="mt-4 flex items-center gap-4">
          <div className="relative h-24 w-24 flex-shrink-0">
            {/* 外圈 */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(from 210deg, #f4a045 0deg, #c84e22 130deg, #8b3a18 220deg, #f4a045 360deg)",
              }}
            />
            {/* 内盘 */}
            <div
              aria-hidden
              className="absolute inset-1.5 rounded-full bg-card shadow-inner"
            />
            {/* 中央 emoji（场景） */}
            <div className="absolute inset-0 flex items-center justify-center text-[2.4rem] drop-shadow-sm">
              <span aria-hidden>{scenarioEmoji}</span>
            </div>
            {/* 高光 */}
            <div
              aria-hidden
              className="absolute inset-1.5 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.55), transparent 55%)",
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted-foreground">当前场景</p>
            <p className="truncate font-display text-[1.05rem] tracking-tight text-foreground">
              {scenarioLabel}
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
              {meal.description}
            </p>
          </div>
        </div>

        {/* 数据仪表 */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onJumpCategories}
            data-testid="hero-card-jump-categories"
            className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-left transition-colors hover-elevate active-elevate-2 hover:border-primary/40"
            title="跳到门类浏览"
          >
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
              菜谱库
            </p>
            <p className="mt-0.5 num font-display text-[1.2rem] leading-none text-primary">
              {recipeCount}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">道 · 8 大门类</p>
          </button>
          <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
              本餐目标
            </p>
            {targetMealCalories ? (
              <>
                <p className="mt-0.5 num font-display text-[1.2rem] leading-none text-primary">
                  {targetMealCalories}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">kcal · 已开启</p>
              </>
            ) : (
              <>
                <p className="mt-0.5 font-display text-[1.05rem] leading-none text-foreground/85">
                  自由
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">未启用饮食计划</p>
              </>
            )}
          </div>
          <div className="col-span-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                环境
              </p>
              <p className="num text-[10.5px] text-muted-foreground">
                {tempText}
              </p>
            </div>
            <p className="mt-0.5 truncate text-[12.5px] text-foreground/85">
              <span className="text-primary">{placeText}</span>
              <span className="mx-1 text-muted-foreground">·</span>
              {weatherText}
            </p>
          </div>
        </div>

        {/* 跳到热榜的卡片入口 */}
        <button
          type="button"
          onClick={onJumpHot}
          data-testid="hero-card-jump-hot"
          className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-left transition-colors hover-elevate active-elevate-2"
          title="跳到饭桌热榜"
        >
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary"
            >
              <Flame className="h-3.5 w-3.5" />
            </span>
            <span>
              <span className="block text-[12.5px] font-medium text-foreground">
                实时饭桌热榜
              </span>
              <span className="block text-[11px] text-muted-foreground">
                6 平台 · 一键找谈资
              </span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-primary" />
        </button>

        {/* 微纹理 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(193,75,42,0.9) 1px, transparent 1px)",
            backgroundSize: "11px 11px",
          }}
        />
      </div>
    </aside>
  );
}

// === 主页 ===
export default function Home() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [shaking, setShaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);

  // 档案与环境
  const [profile, setProfile] = useState<Profile | null>(() => getActiveProfile());
  const [env, setEnv] = useState<EnvContext>(() => loadEnv());
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>("persona");
  const [cloudOpen, setCloudOpen] = useState(false);
  const cloudConfigured = isCloudConfigured();

  // 场景 / 引导
  const [scenarioId, setScenarioId] = useState<ScenarioId>(() => loadScenario());
  // 旧 Onboarding（场景预设选择）保留，但仅在已经看过 Persona 弹窗、且未选择过场景时弹出。
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);

  // v9: 个性化画像（首次进入显示一次轻量弹窗，可关闭）
  const [persona, setPersona] = useState<Persona | null>(() => loadPersona());
  const [personaOpen, setPersonaOpen] = useState<boolean>(() => !hasPersonaSetupShown());

  // 反馈（喜欢 / 不喜欢）— 订阅本地反馈库
  const [reactionTick, setReactionTick] = useState(0);
  useEffect(() => subscribeReactions(() => setReactionTick((x) => x + 1)), []);

  // 收藏 / 历史 / 不吃重复
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [noRepeat, setNoRepeat] = useState<boolean>(() => loadNoRepeat());

  // Tab 导航
  const [tab, setTab] = useState<MainTabId>(() => loadTabFromHash());

  // 餐次会话覆盖（早 / 午 / 晚切换按钮）— 不写到 profile，只保留会话视觉与推荐 ctx。
  const [slotOverride, setSlotOverride] = useState<MealSlot | null>(null);

  // 页面大小 / 字号
  const [pageSize, setPageSize] = useState<PageSizeId>(() => loadPageSize());
  useEffect(() => {
    applyPageSize(pageSize);
    savePageSize(pageSize);
  }, [pageSize]);

  // v2: 主题色系（清爽蓝白默认）
  const [themeId, setThemeId] = useState<ThemeId>(() => loadTheme());
  useEffect(() => {
    applyTheme(themeId);
    saveTheme(themeId);
  }, [themeId]);

  // 食材偏好（想吃什么）
  const [ingredientWish, setIngredientWish] = useState<IngredientWishId[]>([]);

  // 健康规则（来自 health 面板的 syncFlags）
  const [healthFlags, setHealthFlags] = useState<HealthFilterId[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onApplied = () => {
      try {
        const raw = localStorage.getItem("chishenme.health.appliedFlags.v1");
        if (!raw) return;
        const parsed = JSON.parse(raw) as { flags: HealthFilterId[] };
        if (parsed?.flags) {
          setHealthFlags(parsed.flags);
          toast({
            title: "健康规则已应用到「今日推荐」",
            description:
              "推荐排序会优先匹配 " +
              parsed.flags.map(healthFilterLabel).join(" / ") +
              "。",
          });
        }
      } catch {}
    };
    window.addEventListener("chishenme:health-applied", onApplied);
    return () => window.removeEventListener("chishenme:health-applied", onApplied);
  }, [toast]);

  // 真实图片开关（默认开启；用户可通过 LocalStorage 关闭以省流量）
  const [realImagesEnabled, setRealImagesEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("chishenme.realImages.v1");
      return raw == null ? true : raw === "1";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("chishenme.realImages.v1", realImagesEnabled ? "1" : "0");
    } catch {}
  }, [realImagesEnabled]);

  // 应用场景预设到 prefs（Onboarding 选完 / 用户切 Tab 时）
  function applyScenario(id: ScenarioId, opts?: { silent?: boolean }) {
    setScenarioId(id);
    saveScenario(id);
    setPrefs((p) => applyScenarioToPrefs(p, id));
    if (!opts?.silent) {
      toast({
        title: `已切换到「${getScenario(id).label}」`,
        description: "默认人数 / 餐次 / 难度已按场景调整。",
      });
    }
  }

  // 餐次主题：用户在主页直接点「早/午/晚」切换的优先级最高，
  // 然后是 profile.slot，最后是 scenario default。
  const currentSlot: MealSlot =
    slotOverride ?? profile?.slot ?? getScenario(scenarioId).defaultSlot;
  useEffect(() => {
    applyMealTheme(currentSlot);
  }, [currentSlot]);

  // 用户档案的忌口自动并入 prefs.restrictions（不影响 prefs 的其它字段）
  useEffect(() => {
    if (profile?.flavor.restrictions && profile.flavor.restrictions.length > 0) {
      setPrefs((p) => {
        const merged = Array.from(new Set([...p.restrictions, ...profile.flavor.restrictions]));
        if (merged.length === p.restrictions.length) return p;
        return { ...p, restrictions: merged };
      });
    }
  }, [profile]);

  // 进入页面应用一次场景预设（首次 / 旧用户）
  useEffect(() => {
    setPrefs((p) => applyScenarioToPrefs(p, scenarioId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refreshProfile() {
    setProfile(getActiveProfile());
  }

  function applyEnv(next: EnvContext) {
    setEnv(next);
    persistEnv(next);
  }

  // 推荐上下文
  const recommendCtx: RecommendContext = useMemo(() => {
    const ctx: RecommendContext = {};
    if (profile) {
      ctx.flavor = profile.flavor;
      ctx.slot = profile.slot;
      if (profile.planEnabled && profile.body) {
        const planResult = computePlan(profile.body, slotOverride ?? profile.slot);
        ctx.targetMealCalories = planResult.mealCalories;
      }
    }
    // slotOverride 优先；否则保留 profile.slot；否则用 scenario default
    if (slotOverride) ctx.slot = slotOverride;
    ctx.env = resolveEnv(env);
    ctx.scenario = getScenario(scenarioId);
    if (!ctx.slot) ctx.slot = ctx.scenario.defaultSlot;
    ctx.favorites = favorites;
    ctx.recentIds = recentRecipeIds(7);
    ctx.noRepeat = noRepeat;
    ctx.recentSwapIds = recentPoolSet(40);
    if (ingredientWish.length > 0) ctx.ingredientWish = ingredientWish;

    // v9: 把 persona 的健康关注合并进 healthFilter 软规则；persona.moods 合并进
    // scenario.energyHints（不直接改 scenario，新建一个浅拷贝）。
    const personaHF = personaHealthFilters(persona);
    const allHF = Array.from(
      new Set<string>([...healthFlags, ...personaHF]),
    ) as typeof healthFlags;
    if (allHF.length > 0) ctx.healthFilter = allHF;

    const moodHints = personaEnergyHints(persona);
    if (moodHints.length > 0 && ctx.scenario) {
      ctx.scenario = {
        ...ctx.scenario,
        energyHints: Array.from(
          new Set([...ctx.scenario.energyHints, ...moodHints]),
        ) as typeof ctx.scenario.energyHints,
      };
    }

    // 反馈：dish like / dislike + 推断「喜欢的菜系/口味」
    const reactions = loadReactions();
    const likedDish = new Set<string>();
    const dislikedDish = new Set<string>();
    reactions.likes.forEach((k) => {
      if (k.startsWith("dish:")) likedDish.add(k.slice(5));
    });
    reactions.dislikes.forEach((k) => {
      if (k.startsWith("dish:")) dislikedDish.add(k.slice(5));
    });
    if (likedDish.size > 0) ctx.likedDishIds = likedDish;
    if (dislikedDish.size > 0) ctx.dislikedDishIds = dislikedDish;
    if (likedDish.size > 0) ctx.likedTraits = deriveLikedTraits(likedDish);

    return ctx;
    // reactionTick 是为了在反馈变化时刷新；history 仅作为依赖触发 recentIds 重新读取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, env, scenarioId, favorites, history, noRepeat, ingredientWish, healthFlags, slotOverride, persona, reactionTick]);

  // 当前锁定菜品
  const lockedRecipes = useMemo(() => {
    if (!plan) return [];
    return planToList(plan).filter((r) => lockedIds.has(r.id));
  }, [plan, lockedIds]);

  function rollAll() {
    setShaking(true);
    setTimeout(() => {
      // 每次推荐都用最新的会话 ban 池（包含上一轮的推荐结果），避免高频重复。
      const freshBan = recentPoolSet(40);
      const ctx = { ...recommendCtx, recentSwapIds: freshBan };
      const next = recommend(prefs, lockedRecipes, ctx);
      setPlan(next);
      // 把新推荐的菜 ids 写入近期池（持久化 + 会话级 ban），下一次推荐会自动避开
      pushRecent(planToList(next).map((r) => r.id));
      setShaking(false);
    }, 280);
  }

  function swapOne(recipe: Recipe) {
    if (!plan) return;
    const keepLocked = lockedRecipes.filter((r) => r.id !== recipe.id);
    const tempPrefs: Preferences = { ...prefs };
    // 先把被换掉的菜临时加入「会话 ban」，让推荐避开它（避免反复出现同一道菜）
    banInSession([recipe.id]);
    const freshBan = recentPoolSet(40);
    freshBan.add(recipe.id);
    const ctxWithBan = { ...recommendCtx, recentSwapIds: freshBan };
    let attempts = 0;
    let next: MealPlan = recommend(tempPrefs, keepLocked, ctxWithBan);
    while (planToList(next).some((r) => r.id === recipe.id) && attempts < 8) {
      next = recommend(tempPrefs, keepLocked, ctxWithBan);
      attempts++;
    }
    if (planToList(next).some((r) => r.id === recipe.id)) {
      // 实在避不开 — 候选池太小，提示用户
      toast({
        title: "可换的菜较少",
        description: "在当前筛选条件下，还会回到同一道菜。可以放宽口味或减少忌口再试。",
      });
    }
    setPlan(next);
    pushRecent(planToList(next).map((r) => r.id));
    if (lockedIds.has(recipe.id)) {
      const ns = new Set(lockedIds);
      ns.delete(recipe.id);
      setLockedIds(ns);
    }
  }

  function toggleLock(id: string) {
    const ns = new Set(lockedIds);
    if (ns.has(id)) ns.delete(id);
    else ns.add(id);
    setLockedIds(ns);
  }

  function onToggleFavorite(id: string) {
    toggleFavorite(id);
    setFavorites(loadFavorites());
  }

  function refreshFavorites() {
    setFavorites(loadFavorites());
  }

  function onSelectThis() {
    if (!plan) return;
    const list = planToList(plan);
    if (list.length === 0) return;
    const entry: HistoryEntry = {
      ts: Date.now(),
      recipeIds: list.map((r) => r.id),
      names: list.map((r) => r.name),
      slot: SLOT_LABELS[currentSlot],
      scenario: getScenario(scenarioId).label,
    };
    saveHistoryEntry(entry);
    setHistory(loadHistory());
    toast({
      title: "已记下今天就吃这些 ✓",
      description: list.map((r) => r.name).join(" · "),
    });
  }

  function onToggleNoRepeat(v: boolean) {
    setNoRepeat(v);
    saveNoRepeat(v);
  }

  async function copyShoppingList() {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(shoppingListToText(plan));
      setCopied(true);
      toast({ title: "买菜清单已复制", description: "可以粘贴到微信、备忘录或打印出来。" });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "复制失败", description: "请长按选择文字手动复制。", variant: "destructive" });
    }
  }

  const togglePref = <K extends "tastes" | "restrictions" | "cuisines" | "difficulties">(
    key: K,
    value: Preferences[K][number],
  ) => {
    setPrefs((p) => {
      const set = new Set(p[key] as readonly string[]);
      if (set.has(value as string)) set.delete(value as string);
      else set.add(value as string);
      return { ...p, [key]: Array.from(set) as Preferences[K] };
    });
  };

  const shoppingList = plan ? buildShoppingList(plan) : null;
  const totalIngredients = shoppingList
    ? shoppingList["蔬菜"].length +
      shoppingList["肉蛋豆制品"].length +
      shoppingList["调味/主食"].length
    : 0;

  const calSummary = plan && recommendCtx.targetMealCalories
    ? calorieSummary(plan, recommendCtx.targetMealCalories)
    : null;

  // 控卡 / 增肌场景下，若没启用饮食计划：在结果区显眼引导用户去开启。
  const calorieScenario = scenarioId === "personal-cut" || scenarioId === "fitness-bulk";
  const calorieHintNeeded =
    calorieScenario && !recommendCtx.targetMealCalories;

  const meal = MEAL_THEMES[currentSlot];

  const companionCtx: CompanionContext = useMemo(
    () => ({
      scenarioId,
      servings: prefs.servings,
      slot: currentSlot,
      sex: profile?.body?.sex,
      age: profile?.body?.age,
      hasKids: scenarioId === "kid-friendly",
      elderHeavy: scenarioId === "elder-light",
      maxTimeMinutes: prefs.maxTimeMinutes,
    }),
    [scenarioId, prefs.servings, currentSlot, profile?.body?.sex, profile?.body?.age, prefs.maxTimeMinutes],
  );

  return (
    <div className="min-h-safe-screen pb-24">
      {/* Header */}
      <header className="relative z-10 border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Wordmark />
          <div className="flex items-center gap-2">
            <span
              className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[11px] text-muted-foreground sm:inline-flex"
              data-testid="badge-meal-theme"
              title={meal.description}
            >
              {meal.emoji} {meal.label}
            </span>
            <button
              type="button"
              onClick={() => { setProfileTab("account"); setProfileOpen(true); }}
              data-testid="button-open-profile"
              title="打开统一个人档案"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-foreground/85 hover-elevate active-elevate-2"
            >
              <UserCircle2 className="h-3.5 w-3.5 text-primary" />
              {profile ? <span className="max-w-[7em] truncate">{profile.nickname}</span> : "我的档案"}
            </button>
            <button
              type="button"
              onClick={() => { setProfileTab("persona"); setProfileOpen(true); }}
              data-testid="button-open-persona"
              title="打开统一个人档案 · 个性化（与首次弹窗同一份数据）"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-foreground/85 hover-elevate active-elevate-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">个性化</span>
              {persona?.role && (
                <span className="rounded-full bg-primary/10 px-1.5 text-[9.5px] text-primary">
                  {ROLES.find((r) => r.id === persona.role)?.emoji ?? "•"}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setCloudOpen(true)}
              data-testid="button-open-cloud"
              title={cloudConfigured ? "已配置云端同步" : "未配置云端，仅本地模式"}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-foreground/85 hover-elevate active-elevate-2"
            >
              <Cloud className={`h-3.5 w-3.5 ${cloudConfigured ? "text-primary" : "text-muted-foreground"}`} />
              <span className="hidden sm:inline">云端同步</span>
              <span className="rounded-full bg-primary/10 px-1.5 text-[9.5px] text-primary num">Beta</span>
            </button>
            {/* 页面大小：四档分段选择（小 / 中 / 默认 / 大），同时可见，当前选中态高亮。
                同时保留循环按钮（含图标 + 当前档名）作为快速切换；分段选择紧跟其后。 */}
            <button
              type="button"
              onClick={() => {
                const idx = PAGE_SIZES.findIndex((p) => p.id === pageSize);
                const next = PAGE_SIZES[(idx + 1) % PAGE_SIZES.length];
                setPageSize(next.id);
                toast({
                  title: `字号已切到「${next.label}」`,
                  description: next.hint,
                });
              }}
              data-testid="button-page-size"
              title={`当前字号：${PAGE_SIZES.find((p) => p.id === pageSize)?.label} · 点击循环切换`}
              className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[12.5px] text-foreground/85 hover-elevate active-elevate-2 md:inline-flex"
            >
              <TypeIcon className="h-3.5 w-3.5 text-primary" />
              <span data-testid="text-page-size-label">
                {PAGE_SIZES.find((p) => p.id === pageSize)?.label ?? "默认"}
              </span>
            </button>
            <div
              role="group"
              aria-label="页面大小"
              data-testid="page-size-segment"
              title="选择页面字号 · 默认推荐"
              className="inline-flex shrink-0 items-center gap-0.5 overflow-x-auto rounded-full border border-border/70 bg-card/60 p-0.5 text-[11.5px]"
            >
              <TypeIcon className="ml-1 mr-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {PAGE_SIZES.map((p) => {
                const active = p.id === pageSize;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (p.id !== pageSize) {
                        setPageSize(p.id);
                        toast({
                          title: `字号已切到「${p.label}」`,
                          description: p.hint,
                        });
                      }
                    }}
                    data-testid={`button-page-size-${p.id}`}
                    aria-pressed={active}
                    title={p.hint}
                    className={`shrink-0 rounded-full px-2 py-1 transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/80 hover-elevate active-elevate-2"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            {/* v2: 主题循环按钮（点击循环切换主题） */}
            <button
              type="button"
              onClick={() => {
                const idx = THEMES.findIndex((t) => t.id === themeId);
                const next = THEMES[(idx + 1) % THEMES.length];
                setThemeId(next.id);
                toast({
                  title: `主题已切到「${next.label}」`,
                  description: next.hint,
                });
              }}
              data-testid="button-theme"
              title={`当前主题：${THEMES.find((t) => t.id === themeId)?.label} · 点击循环切换`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-2.5 py-1.5 text-[12px] text-foreground/85 hover-elevate active-elevate-2"
            >
              <Palette className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline" data-testid="text-theme-label">
                {THEMES.find((t) => t.id === themeId)?.label.replace(/(.)(.)/, "$1") ?? "主题"}
              </span>
              <span className="flex items-center gap-0.5">
                {(THEMES.find((t) => t.id === themeId)?.swatch ?? []).slice(0, 3).map((c, i) => (
                  <span key={i} className="inline-block h-3 w-1.5 rounded-sm" style={{ background: c }} />
                ))}
              </span>
            </button>
            <a
              href="https://github.com/meimengchengzhen/jin-tian-chi-shenme"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground hover-elevate active-elevate-2 sm:inline-flex"
              data-testid="link-github"
            >
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <MainTabsNav active={tab} onChange={setTab} />
        <div id="tab-content-anchor" className="scroll-mt-32" />

        {tab !== "home" && (
          <div className="pt-6">
            <SubNav active={tab} onChange={(id) => {
              setTab(id);
              if (typeof window !== "undefined") window.location.hash = `#/${id}`;
            }} />
            <Suspense
              fallback={
                <div className="py-10 text-center text-[13px] text-muted-foreground">
                  正在加载…
                </div>
              }
            >
              {tab === "health" && (
                <HealthPanel
                  onPickRecipe={(r) => setDetailRecipe(r)}
                  realImagesEnabled={realImagesEnabled}
                />
              )}
              {tab === "search" && (
                <SearchPanel
                  onPickRecipe={(r) => setDetailRecipe(r)}
                  realImagesEnabled={realImagesEnabled}
                />
              )}
              {tab === "travel" && <TravelPanel />}
              {tab === "takeout" && <TakeoutPanel />}
              {tab === "snacks" && <SnacksPanel />}
              {tab === "fruit" && <FruitPanel />}
              {tab === "lazy" && <LazyDecisionPanel />}
              {tab === "solo" && <SoloTonightPanel />}
              {tab === "family-tonight" && <FamilyTonightPanel />}
              {tab === "tonight-plan" && <TonightPlanPanel />}
              {tab === "weekly" && <WeeklyMenuPanel />}
              {tab === "family" && <FamilyPanel onPickRecipe={(r) => setDetailRecipe(r)} />}
              {tab === "fridge" && <FridgePanel onPickRecipe={(r) => setDetailRecipe(r)} />}
              {tab === "leftover" && <LeftoverPanel />}
              {tab === "shopping" && <ShoppingListPanel />}
              {tab === "companion" && <CompanionPanel ctx={companionCtx} />}
              {tab === "hotboard" && <HotBoard />}
            </Suspense>
            <div className="mt-6 flex justify-end">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11.5px] hover-elevate">
                <span>真实图片（公开图库）</span>
                <Switch
                  checked={realImagesEnabled}
                  onCheckedChange={setRealImagesEnabled}
                  data-testid="switch-real-images"
                />
              </label>
            </div>
          </div>
        )}

        {tab === "home" && (
        <>
        {/* Hero — 升级版：渐变光晕 + 数据徽章 + 智能推荐卡。lg+ 用 mx-auto + 最大 5xl 让右侧卡片有空间。 */}
        <section className="relative pt-10 sm:pt-14 lg:-mx-32 xl:-mx-48">
          {/* 装饰背景 */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-12 -right-12 top-0 -z-10 h-[460px] opacity-[0.55]"
            style={{
              background:
                "radial-gradient(60% 80% at 30% 20%, rgba(244,160,69,0.18), transparent 60%)," +
                " radial-gradient(50% 60% at 80% 30%, rgba(99,140,77,0.14), transparent 70%)",
            }}
          />
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
                <span className="h-px w-8 bg-primary/40" /> {meal.label} · {meal.toneHint}
              </div>
              <h1 className="mt-4 font-display text-[2.4rem] leading-[1.05] tracking-tight sm:text-[3.1rem]">
                {meal.label}就吃这些。
                <br />
                <span className="bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
                  不用再想了。
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted-foreground sm:text-[16.5px]">
                告诉我们今天几个人吃、有多少时间、忌口偏好，
                我们帮你随机搭一桌家常菜，并按蔬菜 / 肉蛋 / 调味分类生成买菜清单。
                可以创建本地档案保存喜好与饮食目标，所有数据都只保存在你的浏览器里。
              </p>
              {/* 数据徽章 — 可点击跳转 */}
              <div className="mt-5 flex flex-wrap gap-2 text-[11.5px]">
                <button
                  type="button"
                  onClick={() => scrollToSection("category-browser-section")}
                  data-testid="hero-stat-recipes"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-foreground/85 transition-colors hover-elevate active-elevate-2 hover:border-primary/40"
                  title="跳到门类浏览"
                >
                  <ChefHat className="h-3 w-3 text-primary" />
                  <span className="num font-medium text-primary">{RECIPES.length}</span>
                  <span className="text-muted-foreground">道菜</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("category-browser-section")}
                  data-testid="hero-stat-categories"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-foreground/85 transition-colors hover-elevate active-elevate-2 hover:border-primary/40"
                  title="跳到门类浏览"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground">8 大门类 · 含甜品 / 饮品 / 烘焙</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("hotboard");
                    if (typeof window !== "undefined") window.location.hash = "#/hotboard";
                  }}
                  data-testid="hero-stat-hotboard"
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-medium text-primary transition-colors hover-elevate active-elevate-2"
                  title="跳到饭桌热榜 Tab"
                >
                  <Flame className="h-3 w-3" />
                  <span>实时饭桌热榜</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("health");
                    if (typeof window !== "undefined") window.location.hash = "#/health";
                  }}
                  data-testid="hero-stat-health"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-700 transition-colors hover-elevate active-elevate-2"
                  title="跳到健康饮食 Tab：低糖 / 低盐 / 低嘌呤"
                >
                  <Leaf className="h-3 w-3" />
                  <span>健康饮食 · 低糖低盐低嘌呤</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* 右侧智能推荐卡 — 移动端隐藏，lg+ 浮现 */}
            <SmartHeroCard
              meal={meal}
              recipeCount={RECIPES.length}
              env={env}
              scenarioLabel={getScenario(scenarioId).label}
              scenarioEmoji={getScenario(scenarioId).emoji}
              targetMealCalories={recommendCtx.targetMealCalories}
              onJumpHot={() => {
                setTab("hotboard");
                if (typeof window !== "undefined") window.location.hash = "#/hotboard";
              }}
              onJumpCategories={() => scrollToSection("category-browser-section")}
            />
          </div>
        </section>

        {/* v10.1 两张人群入口大卡片 — 单人 / 家庭。
            移动端单列展示，sm+ 双列；大字大按钮 + 渐变背景，一眼能看到。 */}
        <section className="mt-7" data-testid="persona-entry-cards">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              className="relative overflow-hidden rounded-3xl border border-rose-200/70 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-5 sm:p-6"
              data-testid="persona-card-solo"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-rose-200/60 to-amber-200/40 blur-2xl"
              />
              <div className="relative">
                <div className="flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.18em] text-rose-700/80">
                  <span aria-hidden className="text-base">🧍</span>
                  一个人吃
                </div>
                <h3 className="mt-2 font-display text-[1.55rem] leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
                  一个人也要好好过
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/75 sm:text-[14px]">
                  常点外卖、靠零食续命、刷剧不知道吃啥也不知道干啥？
                  来，一键替你决定今晚怎么过。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTab("solo");
                    if (typeof window !== "undefined") window.location.hash = "#/solo";
                  }}
                  data-testid="button-persona-solo-cta"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-3.5 text-[15.5px] font-semibold text-white shadow-md shadow-rose-500/25 transition-all hover-elevate active-elevate-2 sm:w-auto sm:text-[16px]"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  一键安排今晚
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-5 sm:p-6"
              data-testid="persona-card-family"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-emerald-200/60 to-cyan-200/40 blur-2xl"
              />
              <div className="relative">
                <div className="flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.18em] text-emerald-700/85">
                  <span aria-hidden className="text-base">👨‍👩‍👧</span>
                  一家人吃
                </div>
                <h3 className="mt-2 font-display text-[1.55rem] leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
                  一家人今晚吃什么
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/75 sm:text-[14px]">
                  家里要做饭，老人小孩口味不一样，预算有限，
                  冰箱里有点存货还有昨天的剩菜——一键给你一桌方案。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTab("family-tonight");
                    if (typeof window !== "undefined") window.location.hash = "#/family-tonight";
                  }}
                  data-testid="button-persona-family-cta"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-[15.5px] font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover-elevate active-elevate-2 sm:w-auto sm:text-[16px]"
                >
                  <Users className="h-4 w-4" aria-hidden />
                  生成家庭饭方案
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 早 / 午 / 晚切换 — 主页显眼大按钮，移动端也能一眼看到。
            点击后 currentSlot 即刻切换，主题变色 + 推荐上下文随之更新。 */}
        <section className="mt-6">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="font-display text-[1.1rem] tracking-tight">想吃哪一餐</h2>
            <span className="text-[12px] text-muted-foreground">
              点一下立刻切换 · 当前 {meal.label}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3" data-testid="meal-slot-switcher">
            {(["breakfast", "lunch", "dinner"] as MealSlot[]).map((s) => {
              const t = MEAL_THEMES[s];
              const active = currentSlot === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlotOverride(s)}
                  data-testid={`button-slot-${s}`}
                  aria-pressed={active}
                  className={`flex h-16 items-center justify-center gap-2 rounded-2xl border-2 px-3 text-[15px] font-semibold transition-all hover-elevate active-elevate-2 sm:h-20 sm:text-[17px] ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.03]"
                      : "border-border bg-card/70 text-foreground/85"
                  }`}
                >
                  <span aria-hidden className="text-2xl sm:text-3xl">
                    {t.emoji}
                  </span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 解决真实问题：家庭口味 / 冰箱有啥 / 剩菜变花样 — v10 三大入口 */}
        <section className="mt-7" data-testid="solve-real-problems">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="font-display text-[1.05rem] tracking-tight">解决真实问题</h2>
            <span className="text-[11px] text-muted-foreground">一家人 · 冰箱里 · 剩菜也能吃</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { id: "family" as MainTabId, emoji: "👨‍👩‍👧", title: "家庭口味协调", hint: "一家人都能一起吃", tone: "from-rose-100 to-amber-100" },
              { id: "fridge" as MainTabId, emoji: "🧊", title: "冰箱有啥", hint: "现有食材能做啥", tone: "from-emerald-100 to-cyan-100" },
              { id: "leftover" as MainTabId, emoji: "♻️", title: "剩菜变花样", hint: "昨天剩菜不浪费", tone: "from-amber-100 to-orange-100" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setTab(c.id);
                  if (typeof window !== "undefined") window.location.hash = `#/${c.id}`;
                }}
                data-testid={`hero-shortcut-${c.id}`}
                className={`flex items-center gap-3 rounded-2xl border bg-gradient-to-br ${c.tone} px-4 py-3 text-left transition-all hover-elevate active-elevate-2`}
              >
                <span aria-hidden className="text-3xl">{c.emoji}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[14.5px] font-semibold text-foreground">{c.title}</span>
                  <span className="text-[11.5px] text-foreground/70">{c.hint}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-foreground/50" />
              </button>
            ))}
          </div>
        </section>

        {/* 更多能力：把旧的二级模块作为卡片宫格收纳进来。
            顶部一级导航只保留 5 个分组，其余功能都在这里发现。 */}
        <section className="mt-7" data-testid="more-capabilities">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="font-display text-[1.05rem] tracking-tight">更多能力</h2>
            <span className="text-[11px] text-muted-foreground">按需发现 · 旧入口都在这里</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              { id: "weekly" as MainTabId, emoji: "🗓️", title: "一周菜单", hint: "家庭+预算" },
              { id: "lazy" as MainTabId, emoji: "🪄", title: "懒人决定", hint: "替你选" },
              { id: "takeout" as MainTabId, emoji: "🛵", title: "外卖", hint: "品牌·凑券" },
              { id: "snacks" as MainTabId, emoji: "🍪", title: "零食", hint: "替你决定" },
              { id: "fruit" as MainTabId, emoji: "🍎", title: "水果", hint: "应季" },
              { id: "travel" as MainTabId, emoji: "✈️", title: "旅行美食", hint: "城市" },
              { id: "hotboard" as MainTabId, emoji: "🔥", title: "饭桌热榜", hint: "本月" },
              { id: "fridge" as MainTabId, emoji: "🧊", title: "冰箱有啥", hint: "现有食材" },
              { id: "leftover" as MainTabId, emoji: "♻️", title: "剩菜变花样", hint: "不浪费" },
              { id: "shopping" as MainTabId, emoji: "🛒", title: "购物清单", hint: "缺料汇总" },
              { id: "search" as MainTabId, emoji: "🔍", title: "菜谱搜索", hint: "按菜名" },
            ] as { id: MainTabId; emoji: string; title: string; hint: string }[]).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setTab(c.id);
                  if (typeof window !== "undefined") window.location.hash = `#/${c.id}`;
                }}
                data-testid={`more-cap-${c.id}`}
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-3 py-2.5 text-left transition-all hover-elevate active-elevate-2"
              >
                <span aria-hidden className="text-2xl">{c.emoji}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13.5px] font-semibold text-foreground">{c.title}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{c.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 场景 Tabs：移动端 2 列网格（一眼可见），桌面端水平 wrap */}
        <section className="mt-7">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="font-display text-[1.05rem] tracking-tight">今天的场景</h2>
            <span className="text-[11px] text-muted-foreground">
              点一下切换默认设置 · 共 {SCENARIOS.length} 个
            </span>
          </div>
          <div
            className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
            data-testid="scenario-grid"
          >
            {SCENARIOS.map((s) => {
              const active = scenarioId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => applyScenario(s.id)}
                  data-testid={`scenario-tab-${s.id}`}
                  className={`flex w-full items-center gap-2 rounded-full border px-3 py-2 text-[13px] transition-colors hover-elevate active-elevate-2 sm:w-auto ${
                    active
                      ? "border-primary/50 bg-primary text-primary-foreground"
                      : "border-border bg-card/60 text-foreground/80"
                  }`}
                >
                  <span aria-hidden className="text-base">{s.emoji}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11.5px] text-muted-foreground" data-testid="text-scenario-desc">
            {getScenario(scenarioId).description}
          </p>
          {(scenarioId === "personal-cut" || scenarioId === "fitness-bulk") &&
            !(profile?.planEnabled && profile.body) && (
              <button
                type="button"
                onClick={() => { setProfileTab("plan"); setProfileOpen(true); }}
                data-testid="banner-enable-plan"
                className="mt-2 inline-flex w-full items-start gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-left text-[12px] hover-elevate active-elevate-2 sm:w-auto"
              >
                <Flame className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <span className="flex-1 text-foreground/85">
                  开启饮食计划后可按热量精细推荐 — 填身高 / 体重 / 活动量即可
                  <span className="ml-1 text-primary underline-offset-2 hover:underline">去设置</span>
                </span>
              </button>
          )}
        </section>

        {/* 历史 / 收藏 快捷入口（始终展示，方便发现） */}
        <section className="mt-3 flex flex-wrap gap-2" data-testid="quick-history-fav">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("history-fav-section");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              } else {
                toast({
                  title: "还没有历史记录",
                  description: "在结果页点「就吃这个了」会保存到本地浏览器。",
                });
              }
            }}
            data-testid="button-quick-history"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-[12.5px] text-foreground/85 hover-elevate active-elevate-2"
          >
            <HistoryIcon className="h-3.5 w-3.5 text-primary" />
            最近就吃了
            <span className="rounded-full bg-primary/10 px-1.5 text-[11px] text-primary num">
              {history.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("history-fav-section");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              } else {
                toast({
                  title: "还没有收藏",
                  description: "点菜卡上的爱心收藏起来；下次推荐会有更高几率出现。",
                });
              }
            }}
            data-testid="button-quick-fav"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-[12.5px] text-foreground/85 hover-elevate active-elevate-2"
          >
            <Heart className={`h-3.5 w-3.5 ${favorites.size > 0 ? "fill-rose-500 text-rose-500" : "text-rose-500"}`} />
            我收藏的菜
            <span className="rounded-full bg-rose-50 px-1.5 text-[11px] text-rose-600 num">
              {favorites.size}
            </span>
          </button>
          <span className="ml-auto self-center text-[11px] text-muted-foreground">
            数据仅保存在你浏览器本地
          </span>
        </section>

        {/* 上下文条：登录 / 环境 / 饮食计划 */}
        <section className="mt-5">
          <Card className="grain border-card-border/60 bg-card/70 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px]">
              <button
                type="button"
                onClick={() => { setProfileTab("account"); setProfileOpen(true); }}
                data-testid="chip-profile-summary"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-primary hover-elevate active-elevate-2"
              >
                <UserCircle2 className="h-3.5 w-3.5" />
                {profile ? `Hi, ${profile.nickname}` : "未登录 — 通用推荐"}
              </button>
              <button
                type="button"
                onClick={() => { setProfileTab("env"); setProfileOpen(true); }}
                data-testid="chip-env-summary"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-foreground/80 hover-elevate active-elevate-2"
              >
                <Cloud className="h-3.5 w-3.5" />
                {env.city || env.province || (env.region === "未指定" ? "地区未设" : env.region)}
                <span className="text-muted-foreground">·</span>
                {env.weather === "未指定" ? "天气未设" : env.weather}
                {env.temperatureC !== undefined && (
                  <span className="num text-muted-foreground">{env.temperatureC}°C</span>
                )}
                <span className="text-muted-foreground">·</span>
                <CalendarDays className="h-3 w-3" />
                {recommendCtx.env?.season} / {recommendCtx.env?.dayKind === "weekend" ? "周末" : "工作日"}
              </button>
              {profile?.planEnabled && profile.body && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-medium text-primary"
                  data-testid="chip-plan-summary"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {SLOT_LABELS[profile.slot]} 目标 ≈
                  <span className="num">
                    {computePlan(profile.body, profile.slot).mealCalories}
                  </span>
                  kcal
                </span>
              )}
              <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 hover-elevate">
                <Repeat className="h-3.5 w-3.5 text-primary" />
                <span>不吃重复的</span>
                <Switch
                  checked={noRepeat}
                  onCheckedChange={onToggleNoRepeat}
                  data-testid="switch-no-repeat"
                />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 hover-elevate" title="开启后从公开图库拉真实菜品图，加载失败会自动回落本地示意图">
                <span>真实图片</span>
                <Switch
                  checked={realImagesEnabled}
                  onCheckedChange={setRealImagesEnabled}
                  data-testid="switch-real-images-home"
                />
              </label>
              {healthFlags.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHealthFlags([])}
                  data-testid="chip-health-flags"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-700 hover-elevate"
                  title="点击清除"
                >
                  <Leaf className="h-3.5 w-3.5" />
                  健康规则: {healthFlags.map(healthFilterLabel).join(" / ")}
                </button>
              )}
            </div>
          </Card>
        </section>

        {/* 偏好表单 */}
        <section className="mt-7">
          <Card className="grain border-card-border/60 bg-card/70 p-5 sm:p-6">
            {/* 人数 */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Users className="h-4 w-4 text-primary" /> 几个人吃
                </Label>
                <span className="font-display text-lg num text-primary" data-testid="text-servings">
                  {prefs.servings} 人
                </span>
              </div>
              <Slider
                value={[prefs.servings]}
                min={1}
                max={8}
                step={1}
                onValueChange={(v) => setPrefs((p) => ({ ...p, servings: v[0] }))}
                data-testid="slider-servings"
              />
            </div>

            {/* 用时 */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Clock className="h-4 w-4 text-primary" /> 最长能花多少时间
                </Label>
                <span className="font-display text-lg num text-primary" data-testid="text-time">
                  {prefs.maxTimeMinutes} 分钟
                </span>
              </div>
              <Slider
                value={[prefs.maxTimeMinutes]}
                min={15}
                max={120}
                step={5}
                onValueChange={(v) => setPrefs((p) => ({ ...p, maxTimeMinutes: v[0] }))}
                data-testid="slider-time"
              />
              <div className="mt-1 flex justify-between text-[10.5px] text-muted-foreground num">
                <span>15 分钟快手</span>
                <span>2 小时慢炖</span>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-border/60 bg-background/50 p-3">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium">主菜数量</Label>
                <div className="flex gap-1">
                  {[1, 2, 3].map((n) => (
                    <Chip
                      key={n}
                      active={prefs.mainCount === n}
                      onClick={() => setPrefs((p) => ({ ...p, mainCount: n }))}
                      testId={`chip-main-${n}`}
                    >
                      {n}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <Switch
                    checked={prefs.withVeggie}
                    onCheckedChange={(c) => setPrefs((p) => ({ ...p, withVeggie: c }))}
                    data-testid="switch-veggie"
                  />
                  <span className="inline-flex items-center gap-1">
                    <Salad className="h-3.5 w-3.5" /> 配素菜
                  </span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <Switch
                    checked={prefs.withSoup}
                    onCheckedChange={(c) => setPrefs((p) => ({ ...p, withSoup: c }))}
                    data-testid="switch-soup"
                  />
                  <span className="inline-flex items-center gap-1">
                    <Soup className="h-3.5 w-3.5" /> 配汤
                  </span>
                </label>
              </div>
            </div>

            <Separator className="my-5" />

            <SectionTitle num="01" title="想吃什么" hint="可多选 · 软偏好，不违反硬忌口" />
            <div className="flex flex-wrap gap-2" data-testid="wish-chips">
              {WISH_OPTIONS.map((w) => (
                <Chip
                  key={w.id}
                  active={ingredientWish.includes(w.id)}
                  onClick={() =>
                    setIngredientWish((prev) =>
                      prev.includes(w.id)
                        ? prev.filter((x) => x !== w.id)
                        : [...prev, w.id],
                    )
                  }
                  testId={`chip-wish-${w.id}`}
                >
                  <span className="mr-1" aria-hidden>{w.emoji}</span>
                  {w.label}
                </Chip>
              ))}
            </div>

            <div className="mt-5">
              <SectionTitle num="02" title="口味偏好" hint="可多选 / 留空不限" />
              <div className="flex flex-wrap gap-2">
                {ALL_TASTES.map((t) => (
                  <Chip
                    key={t}
                    active={prefs.tastes.includes(t)}
                    onClick={() => togglePref("tastes", t)}
                    testId={`chip-taste-${t}`}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <SectionTitle num="03" title="忌口 / 饮食限制" hint="勾选避开" />
              <div className="flex flex-wrap gap-2">
                {ALL_RESTRICTIONS.map((r) => (
                  <Chip
                    key={r}
                    active={prefs.restrictions.includes(r)}
                    onClick={() => togglePref("restrictions", r)}
                    testId={`chip-restriction-${r}`}
                  >
                    {r}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <SectionTitle num="04" title="菜系" />
                <div className="flex flex-wrap gap-2">
                  {ALL_CUISINES.map((c) => (
                    <Chip
                      key={c}
                      active={prefs.cuisines.includes(c)}
                      onClick={() => togglePref("cuisines", c)}
                      testId={`chip-cuisine-${c}`}
                    >
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <SectionTitle num="05" title="难度" />
                <div className="flex flex-wrap gap-2">
                  {ALL_DIFFICULTIES.map((d) => (
                    <Chip
                      key={d}
                      active={prefs.difficulties.includes(d)}
                      onClick={() => togglePref("difficulties", d)}
                      testId={`chip-difficulty-${d}`}
                    >
                      {d}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="group h-14 flex-1 gap-2 rounded-full text-[15px] font-semibold shadow-lg shadow-primary/20"
              onClick={rollAll}
              data-testid="button-roll"
            >
              <span className={`inline-flex ${shaking ? "animate-wiggle" : ""}`}>
                <Sparkles className="h-5 w-5" />
              </span>
              {plan ? "换一组试试" : `${meal.label}吃什么 →`}
            </Button>
            {plan && (
              <Button
                variant="outline"
                size="lg"
                className="h-14 rounded-full"
                onClick={() => {
                  setPlan(null);
                  setLockedIds(new Set());
                }}
                data-testid="button-reset"
              >
                重置
              </Button>
            )}
          </div>
          {plan && lockedIds.size > 0 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              已锁定 {lockedIds.size} 道菜，下一次随机会保留
            </p>
          )}
        </section>

        {/* 结果 */}
        {plan && (
          <section className="mt-10">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-[1.4rem] tracking-tight">{meal.label}就吃这些</h2>
              <span className="text-xs text-muted-foreground">
                共 {planToList(plan).length} 道 · {prefs.servings} 人份
              </span>
            </div>

            {/* 兜底：放宽提示 */}
            {plan.relaxedNotes && plan.relaxedNotes.length > 0 && planToList(plan).length > 0 && (
              <div
                className="mb-3 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-[12.5px] text-foreground/80"
                data-testid="banner-relaxed"
              >
                <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <span>
                  当前筛选有点严格，已自动放宽：
                  <span className="font-medium text-primary">
                    {plan.relaxedNotes.join(" · ")}
                  </span>
                  。忌口和饮食禁忌仍然完全遵守。
                </span>
              </div>
            )}

            {/* 兜底：仍无结果 */}
            {planToList(plan).length === 0 && (
              <div
                className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-[13px] text-foreground/85"
                data-testid="banner-no-result"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <div>
                  <div className="font-medium">没有匹配到任何菜</div>
                  <div className="mt-1 text-[12px] text-muted-foreground">
                    {(() => {
                      const hint = buildEmptyHint(prefs);
                      return hint;
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* v7: 桌面结构提示 — 主菜 / 素菜 / 汤是否齐全；长辈/儿童友好提示 */}
            {plan.tableBalance && planToList(plan).length > 0 && (
              <div
                className={`mb-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px] ${
                  plan.tableBalance.level === "warn"
                    ? "border-amber-500/40 bg-amber-500/10 text-foreground/85"
                    : "border-emerald-500/30 bg-emerald-500/5 text-foreground/85"
                }`}
                data-testid="banner-table-balance"
              >
                <Info className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${plan.tableBalance.level === "warn" ? "text-amber-500" : "text-emerald-600"}`} />
                <span>
                  这一桌结构：
                  <span className="font-medium">
                    {plan.tableBalance.notes.join(" · ")}
                  </span>
                </span>
              </div>
            )}

            {/* 兜底：未填满的 course */}
            {plan.unmetCourses && plan.unmetCourses.length > 0 && planToList(plan).length > 0 && (
              <div
                className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[12.5px] text-foreground/80"
                data-testid="banner-partial"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                <span>
                  以下分类暂无符合忌口的菜：
                  <span className="font-medium">
                    {plan.unmetCourses
                      .map((c) => COURSE_LABEL[c] ?? c)
                      .join(" · ")}
                  </span>
                  。可以试试关闭对应开关或减少忌口。
                </span>
              </div>
            )}

            {/* 控卡 / 增肌 但未启用饮食计划：显眼引导 */}
            {calorieHintNeeded && (
              <Card
                className="mb-3 border-primary/40 bg-primary/5 p-3 text-[13px]"
                data-testid="panel-calorie-hint"
              >
                <div className="flex items-start gap-2">
                  <Flame className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      想按热量精细推荐？开启饮食计划即可
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      你选了「{getScenario(scenarioId).label}」。在档案里填身高 / 体重 / 活动量并开启饮食计划，
                      推荐就会给出本餐目标热量、人均合计、偏轻 / 接近 / 偏高的评估。所有数据只保存在你的浏览器里。
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => { setProfileTab("plan"); setProfileOpen(true); }}
                    data-testid="button-open-profile-from-calorie-hint"
                    className="h-8 rounded-full text-[12px]"
                  >
                    去设置
                  </Button>
                </div>
              </Card>
            )}

            {/* 餐次热量汇总 */}
            {calSummary && (
              <Card
                className={`mb-3 border-primary/40 bg-primary/5 p-3 text-[13px] ${
                  calSummary.verdict === "ok"
                    ? ""
                    : "border-amber-500/40 bg-amber-500/5"
                }`}
                data-testid="panel-calorie-summary"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-[15px] text-primary">
                    <Flame className="mr-1 inline h-4 w-4" /> 本餐热量评估
                  </span>
                  <span className="num">
                    人均合计 <span className="font-medium text-primary">{calSummary.perPersonTotal}</span> kcal
                  </span>
                  <span className="num text-muted-foreground">
                    目标 {calSummary.targetMealCalories} kcal
                  </span>
                  <span className="num text-muted-foreground">
                    差距 {calSummary.gap > 0 ? "+" : ""}{calSummary.gap} kcal
                  </span>
                  <Badge
                    variant="outline"
                    className={`ml-auto rounded-full px-2 py-0 text-[11.5px] ${
                      calSummary.verdict === "ok"
                        ? "border-primary/50 text-primary"
                        : "border-amber-500/60 text-amber-700"
                    }`}
                    data-testid="badge-calorie-verdict"
                  >
                    {calSummary.verdict === "ok"
                      ? "本餐热量接近目标"
                      : calSummary.verdict === "low"
                        ? "本餐热量偏轻"
                        : "本餐热量偏高"}
                  </Badge>
                </div>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  这是<strong className="text-foreground/85">这一餐</strong>的估算热量，不代表你的身体状态。按档案里的身高/体重/活动量推算今日餐次目标后做对比。
                </p>
                {calSummary.verdict === "low" && (
                  <p
                    className="mt-1 text-[11.5px] text-amber-700"
                    data-testid="text-calorie-tip-low"
                  >
                    {scenarioId === "personal-cut"
                      ? "控卡场景下偏低是可以接受的；如果会饿，可以加一份主食或一碗汤。"
                      : scenarioId === "fitness-bulk"
                        ? "增肌场景建议补充：可以「换一组」或加一道主菜 / 一份米饭。"
                        : "如果想吃饱一点：可以加一份主食、再换一道高热量主菜。"}
                  </p>
                )}
                {calSummary.verdict === "high" && (
                  <p
                    className="mt-1 text-[11.5px] text-amber-700"
                    data-testid="text-calorie-tip-high"
                  >
                    本餐热量偏高 — 可以减一道主菜 / 改素菜搭配，或拉长用餐节奏。
                  </p>
                )}
              </Card>
            )}

            <div className="grid gap-3">
              {plan.mains.map((r) => (
                <DishCard
                  key={r.id}
                  recipe={r}
                  locked={lockedIds.has(r.id)}
                  favorite={favorites.has(r.id)}
                  onToggleLock={() => toggleLock(r.id)}
                  onSwap={() => swapOne(r)}
                  onOpenDetail={() => setDetailRecipe(r)}
                  onToggleFavorite={() => onToggleFavorite(r.id)}
                  targetMealCal={recommendCtx.targetMealCalories}
                  realImagesEnabled={realImagesEnabled}
                />
              ))}
              {plan.veggie && (
                <DishCard
                  recipe={plan.veggie}
                  locked={lockedIds.has(plan.veggie.id)}
                  favorite={favorites.has(plan.veggie.id)}
                  onToggleLock={() => toggleLock(plan.veggie!.id)}
                  onSwap={() => swapOne(plan.veggie!)}
                  onOpenDetail={() => setDetailRecipe(plan.veggie!)}
                  onToggleFavorite={() => onToggleFavorite(plan.veggie!.id)}
                  targetMealCal={recommendCtx.targetMealCalories}
                  realImagesEnabled={realImagesEnabled}
                />
              )}
              {plan.soup && (
                <DishCard
                  recipe={plan.soup}
                  locked={lockedIds.has(plan.soup.id)}
                  favorite={favorites.has(plan.soup.id)}
                  onToggleLock={() => toggleLock(plan.soup!.id)}
                  onSwap={() => swapOne(plan.soup!)}
                  onOpenDetail={() => setDetailRecipe(plan.soup!)}
                  onToggleFavorite={() => onToggleFavorite(plan.soup!.id)}
                  targetMealCal={recommendCtx.targetMealCalories}
                  realImagesEnabled={realImagesEnabled}
                />
              )}
            </div>

            {/* 「就吃这个了」按钮 */}
            {planToList(plan).length > 0 && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="default"
                  className="h-12 flex-1 gap-2 rounded-full"
                  onClick={onSelectThis}
                  data-testid="button-pick-this"
                >
                  <CheckCircle2 className="h-4 w-4" /> 就吃这个了 · 记到本地历史
                </Button>
              </div>
            )}

            {/* 买菜清单 */}
            {shoppingList && planToList(plan).length > 0 && (
              <div className="mt-8">
                <Card className="grain border-card-border/60 bg-card/80 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <ShoppingBasket className="h-4 w-4" />
                        </span>
                        <h3 className="font-display text-[1.25rem] tracking-tight">
                          今日买菜清单
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground num">
                        共 {totalIngredients} 项 · 已按品类整理
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyShoppingList}
                      className="rounded-full"
                      data-testid="button-copy-list"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5 text-primary" /> 已复制
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5" /> 复制清单
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-3">
                    {(["蔬菜", "肉蛋豆制品", "调味/主食"] as const).map((cat) => {
                      const items = shoppingList[cat];
                      const tone =
                        cat === "蔬菜"
                          ? "text-[#6B8E3D]"
                          : cat === "肉蛋豆制品"
                          ? "text-primary"
                          : "text-[#8A6B2B]";
                      return (
                        <div key={cat}>
                          <div className="mb-2 flex items-baseline justify-between">
                            <h4 className={`text-[12px] font-semibold uppercase tracking-wider ${tone}`}>
                              {cat}
                            </h4>
                            <span className="text-[10.5px] text-muted-foreground num">
                              {items.length}
                            </span>
                          </div>
                          {items.length === 0 ? (
                            <p className="text-xs text-muted-foreground">— 无 —</p>
                          ) : (
                            <ul className="space-y-1.5">
                              {items.map((it) => (
                                <li
                                  key={it.name}
                                  className="flex items-baseline justify-between gap-2 border-b border-dashed border-border/60 pb-1.5 last:border-0"
                                  data-testid={`item-${it.name}`}
                                >
                                  <span className="text-[13.5px]">{it.name}</span>
                                  <span className="text-[11.5px] text-muted-foreground num">
                                    {it.qty.join(" / ")}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}
          </section>
        )}

        {/* 门类浏览：甜品 / 饮品 / 小吃 / 烘焙 等。饭桌陪伴/热榜已拆到独立 Tab。 */}
        <CategoryBrowser onPickRecipe={(r) => setDetailRecipe(r)} />

        {/* 历史 / 收藏 */}
        {(history.length > 0 || favorites.size > 0) && (
          <section
            id="history-fav-section"
            className="mt-10 grid gap-3 sm:grid-cols-2"
            data-testid="section-history-fav"
          >
            {history.length > 0 && (
              <Card className="border-card-border/60 bg-card/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-[1.05rem] tracking-tight">最近就吃了</h3>
                  <span className="ml-auto text-[11px] text-muted-foreground num">
                    {history.length} 条
                  </span>
                </div>
                <ul className="space-y-2" data-testid="list-history">
                  {history.slice(0, 5).map((e) => (
                    <li
                      key={e.ts}
                      className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-[12.5px]"
                      data-testid={`history-${e.ts}`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-muted-foreground num">
                          {new Date(e.ts).toLocaleDateString("zh-CN")} ·{" "}
                          {e.scenario ?? ""} {e.slot ?? ""}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate">{e.names.join(" · ")}</div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  打开「不吃重复的」开关，未来推荐会避开这些菜。
                </p>
              </Card>
            )}
            {favorites.size > 0 && (
              <Card className="border-card-border/60 bg-card/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                  <h3 className="font-display text-[1.05rem] tracking-tight">我收藏的菜</h3>
                  <span className="ml-auto text-[11px] text-muted-foreground num">
                    {favorites.size} 道
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5" data-testid="list-favorites">
                  {Array.from(favorites)
                    .map((id) => RECIPES.find((r) => r.id === id))
                    .filter((r): r is Recipe => !!r)
                    .slice(0, 12)
                    .map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setDetailRecipe(r)}
                        className="rounded-full border border-rose-300/60 bg-rose-50/80 px-2.5 py-1 text-[12px] hover-elevate"
                        data-testid={`fav-chip-${r.id}`}
                      >
                        {r.name}
                      </button>
                    ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  收藏过的菜在未来推荐中会有更高几率出现。
                </p>
              </Card>
            )}
          </section>
        )}
        </>
        )}

        <footer className="mt-16 flex flex-col items-center gap-2 pb-8 text-center text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 text-primary/80">
            <Logo size={20} /> 今天吃什么
          </span>
          <span>
            原型作品 · 内置 {planLengthLabel()} 道示例菜谱 · 不收集任何数据
          </span>
        </footer>
      </main>

      <DishDetail
        recipe={detailRecipe}
        servings={prefs.servings}
        onClose={() => setDetailRecipe(null)}
        onFavoriteChange={refreshFavorites}
        realImagesEnabled={realImagesEnabled}
        onToggleRealImages={setRealImagesEnabled}
      />

      <ProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onChange={refreshProfile}
        env={env}
        onEnvChange={applyEnv}
        defaultTab={profileTab}
        onPersonaChange={(p) => setPersona(p)}
      />

      <Onboarding
        open={onboardingOpen}
        onPick={(id) => {
          applyScenario(id, { silent: true });
          markOnboarded();
          setOnboardingOpen(false);
        }}
        onSkip={() => {
          markOnboarded();
          setOnboardingOpen(false);
        }}
      />

      <PersonaWelcome
        open={personaOpen}
        initial={persona}
        onClose={() => {
          markPersonaSetupShown();
          setPersonaOpen(false);
        }}
        onSave={(p, opts) => {
          const next: Persona = { ...p, updatedAt: Date.now() };
          savePersona(next);
          setPersona(next);
          markPersonaSetupShown();
          setPersonaOpen(false);

          // 统一档案：首次完成弹窗时，如果还没有 Profile，则自动创建一个
          // （从 persona 推导 body：身高/体重/性别/年龄段），让「我的档案」里直接看到这份数据。
          syncPersonaToProfile(next);
          refreshProfile();

          // 若选了 role，做相应跳转 + 场景预设
          if (p.role) {
            const role = ROLES.find((r) => r.id === p.role);
            if (role?.defaultScenario) {
              applyScenario(role.defaultScenario, { silent: true });
            }
            if (opts.jumpRole && role) {
              setTab(role.preferredTab);
              if (typeof window !== "undefined") {
                try {
                  window.history.replaceState(null, "", `#/${role.preferredTab}`);
                } catch {}
              }
            }
          }
          toast({
            title: "个性化已保存（仅本地）",
            description: "之后点「我的档案」或「个性化」都会打开同一份数据。",
          });
        }}
      />

      <CloudSyncDialog open={cloudOpen} onClose={() => setCloudOpen(false)} />

      {/* v2: 今日已选浮窗 */}
      <TodayDock />
    </div>
  );
}

function planLengthLabel() {
  return String(RECIPES.length);
}

// 当推荐结果为空时，给用户讲清楚是「忌口太严格」还是「软性条件太严格」。
function buildEmptyHint(prefs: Preferences): string {
  const hardCounts = countByCourseUnderHardOnly(prefs);
  const reasons: string[] = [];
  const want: { key: "main" | "veggie" | "soup"; label: string; need: boolean }[] = [
    { key: "main", label: "主菜", need: prefs.mainCount > 0 },
    { key: "veggie", label: "素菜", need: prefs.withVeggie },
    { key: "soup", label: "汤", need: prefs.withSoup },
  ];
  const blockedByRestrictions = want
    .filter((w) => w.need && hardCounts[w.key] === 0)
    .map((w) => w.label);

  if (blockedByRestrictions.length > 0) {
    reasons.push(
      `当前忌口（${prefs.restrictions.join(" · ")}）已经把所有「${blockedByRestrictions.join(
        " · ",
      )}」类菜都筛掉了，建议减少忌口或关闭对应开关。`,
    );
  } else {
    reasons.push(
      `你的忌口组合在 ${RECIPES.length} 道示例菜里没有完全匹配的菜。可以尝试关闭「配素菜 / 配汤」或减少忌口标签。`,
    );
  }
  return reasons.join(" ");
}
