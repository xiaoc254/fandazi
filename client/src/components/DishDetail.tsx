import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  ChefHat,
  Flame,
  Leaf,
  PlayCircle,
  Info,
  Users,
  Coins,
  Sparkles,
  Heart,
  Search,
  Video,
  ExternalLink,
} from "lucide-react";
import type { Recipe } from "@/data/recipes";
import { estimateIngredient } from "@/data/ingredients";
import { dishVisual, buildSearchEntries } from "@/lib/dishVisual";
import { DishImage } from "@/components/DishImage";
import { DishPhoto } from "@/components/DishPhoto";
import { isFavorite, toggleFavorite } from "@/lib/history";

interface DishDetailProps {
  recipe: Recipe | null;
  servings: number;
  onClose: () => void;
  /** 收藏状态变化时回调，让上层重算推荐权重 */
  onFavoriteChange?: () => void;
  /** 是否启用真实图片（与列表页保持一致；详情头优先真实图，失败回落示意图） */
  realImagesEnabled?: boolean;
  /** 用户切换「使用示意图」时的回调 */
  onToggleRealImages?: (next: boolean) => void;
}

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

const SEARCH_ICON: Record<string, typeof Video> = {
  bilibili: Video,
  douyin: PlayCircle,
  baidu: Search,
};

export function DishDetail({
  recipe,
  servings,
  onClose,
  onFavoriteChange,
  realImagesEnabled = true,
  onToggleRealImages,
}: DishDetailProps) {
  const visual = useMemo(
    () => (recipe ? dishVisual(recipe.name, recipe.course, recipe.cuisine) : null),
    [recipe],
  );

  const [fav, setFav] = useState(false);
  useEffect(() => {
    if (recipe) setFav(isFavorite(recipe.id));
  }, [recipe]);

  const estimates = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing) => ({
      ingredient: ing,
      ...estimateIngredient(ing.name, ing.qty),
    }));
  }, [recipe]);

  const totals = useMemo(() => {
    if (!recipe) return { calories: 0, price: 0, hasUnknown: false };
    let calories = 0;
    let price = 0;
    let hasUnknown = false;
    for (const e of estimates) {
      if (e.grams === null) {
        hasUnknown = true;
        continue;
      }
      calories += e.calories;
      price += e.price;
    }
    price = Math.round(price * 10) / 10;
    return { calories, price, hasUnknown };
  }, [estimates, recipe]);

  if (!recipe || !visual) return null;

  const perPersonCalories = Math.round(totals.calories / Math.max(servings, 1));
  const perPersonPrice = Math.round((totals.price / Math.max(servings, 1)) * 10) / 10;
  const searchEntries = buildSearchEntries(recipe.name, recipe.videoQuery);

  function onToggleFav() {
    if (!recipe) return;
    const next = toggleFavorite(recipe.id);
    setFav(next);
    onFavoriteChange?.();
  }

  return (
    <Dialog open={!!recipe} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl"
        data-testid="dialog-detail"
      >
        {/* 视觉头部：详情页与列表共用同一 imageProvider；真实图加载失败时由 DishPhoto 回落到本地示意图。 */}
        <div className="relative overflow-hidden rounded-t-md">
          {realImagesEnabled ? (
            <DishPhoto
              name={recipe.name}
              visual={visual}
              alt={`${recipe.name} 菜品示意图`}
              className="h-44 w-full sm:h-52"
              large
              showName={false}
              showSourceBadge={false}
            />
          ) : (
            <DishImage
              visual={visual}
              alt={`${recipe.name} 菜品氛围示意图`}
              className="h-44 w-full sm:h-52"
              large
              showBadge={false}
            />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)",
            }}
          />
          {/* 真实/示意切换：左上角，避让 Dialog 自带的右上角关闭 X 按钮 */}
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
            {onToggleRealImages ? (
              <button
                type="button"
                onClick={() => onToggleRealImages(!realImagesEnabled)}
                data-testid="button-toggle-illustrative"
                title={realImagesEnabled ? "切换到本地示意图" : "尝试加载公开图库真实图"}
                className="rounded-full bg-black/40 px-2 py-0.5 text-[10.5px] text-white backdrop-blur-sm transition-colors hover:bg-black/55"
              >
                {realImagesEnabled ? "图库 · 示意图 · 切换" : "本地示意图 · 切换"}
              </button>
            ) : (
              <span
                className="rounded-full bg-black/35 px-2 py-0.5 text-[10.5px] text-white backdrop-blur-sm"
                data-testid="badge-illustrative"
                title="本图仅作示意，可能与实际成品不完全一致"
              >
                {realImagesEnabled ? "图库 · 示意图" : "本地示意图"}
              </span>
            )}
          </div>
          {/* 收藏按钮：图片右上角下方一行，避让右上角的关闭 X 按钮，移动端也确保不重叠 */}
          <button
            type="button"
            onClick={onToggleFav}
            data-testid={`button-fav-detail-${recipe.id}`}
            aria-label={fav ? "取消收藏" : "收藏这道菜"}
            className={`absolute right-3 top-14 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-colors ${
              fav
                ? "bg-rose-500/90 text-white"
                : "bg-white/40 text-white hover:bg-white/55"
            }`}
          >
            <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
          </button>
          <div className="absolute inset-x-0 bottom-0 px-6 pb-4 pt-5 text-white sm:px-7">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
              <span>{recipe.cuisine}</span>
              <span aria-hidden>•</span>
              <span>
                {recipe.course === "main"
                  ? "主菜"
                  : recipe.course === "veggie"
                    ? "素菜"
                    : recipe.course === "soup"
                      ? "汤"
                      : "主食"}
              </span>
              <span aria-hidden>{visual.badge}</span>
            </div>
            <DialogHeader className="mt-1 text-left">
              <DialogTitle
                className="font-display text-[1.6rem] leading-tight tracking-tight text-white sm:text-[1.9rem]"
                data-testid={`detail-name-${recipe.id}`}
              >
                {recipe.name}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px] leading-relaxed text-white/90 sm:text-[14px]">
                <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                {recipe.reason}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/95">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> 约 {recipe.timeMinutes} 分钟
              </span>
              <span className="inline-flex items-center gap-1">
                <ChefHat className="h-3.5 w-3.5" /> {recipe.difficulty}
                <DifficultyDots d={recipe.difficulty} />
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {recipe.serves} 人起
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recipe.tastes.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="rounded-full border-0 bg-white/25 px-2 py-0 text-[11px] text-white"
                >
                  {(t === "麻辣" || t === "重辣" || t === "微辣") && (
                    <Flame className="mr-0.5 h-2.5 w-2.5" />
                  )}
                  {t === "清淡" && <Leaf className="mr-0.5 h-2.5 w-2.5" />}
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div className="px-6 pb-6 pt-5 sm:px-7">
          {/* 营养与价格汇总 */}
          <section className="mb-5">
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="font-display text-[1rem] tracking-tight">
                这道菜大约
              </h3>
              <span className="text-[11px] text-muted-foreground">估算值，仅供参考</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-border/60 bg-card/60 p-3">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  总热量
                </div>
                <div
                  className="mt-1 font-display text-[1.3rem] text-primary num"
                  data-testid={`detail-total-calories-${recipe.id}`}
                >
                  {totals.calories}
                  <span className="ml-1 text-xs text-muted-foreground">kcal</span>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/60 p-3">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  人均热量
                </div>
                <div
                  className="mt-1 font-display text-[1.3rem] text-primary num"
                  data-testid={`detail-per-person-calories-${recipe.id}`}
                >
                  {perPersonCalories}
                  <span className="ml-1 text-xs text-muted-foreground">kcal</span>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/60 p-3">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  总价
                </div>
                <div
                  className="mt-1 font-display text-[1.3rem] text-foreground num"
                  data-testid={`detail-total-price-${recipe.id}`}
                >
                  ¥{totals.price.toFixed(1)}
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/60 p-3">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  人均
                </div>
                <div
                  className="mt-1 font-display text-[1.3rem] text-foreground num"
                  data-testid={`detail-per-person-price-${recipe.id}`}
                >
                  ¥{perPersonPrice.toFixed(1)}
                </div>
              </div>
            </div>
            {totals.hasUnknown && (
              <div className="mt-2 flex items-start gap-1.5 text-[11.5px] text-muted-foreground">
                <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>
                  含「适量」「少许」等不易称量的调味料，未计入估算（实际差异通常很小）。
                </span>
              </div>
            )}
          </section>

          {/* 食材明细 */}
          <section className="mb-5">
            <h3 className="mb-2 font-display text-[1rem] tracking-tight">食材清单</h3>
            <div className="grid gap-2">
              {estimates.map((e) => (
                <div
                  key={e.ingredient.name}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-2.5"
                  data-testid={`detail-ingredient-${e.ingredient.name}`}
                >
                  <div
                    className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-[1.5rem]"
                    style={{
                      background: `linear-gradient(135deg, ${e.info.gradient[0]}, ${e.info.gradient[1]})`,
                    }}
                    aria-hidden
                  >
                    <span className="drop-shadow-sm">{e.info.emoji}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14px] font-medium">
                        {e.ingredient.name}
                      </span>
                      <span className="text-[11.5px] text-muted-foreground num">
                        {e.ingredient.qty}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
                      {e.grams !== null ? (
                        <>
                          <span className="num">≈ {e.grams}g</span>
                          <span className="num">
                            <Flame className="mr-0.5 inline h-3 w-3" />
                            {e.calories} kcal
                          </span>
                          <span className="num">
                            <Coins className="mr-0.5 inline h-3 w-3" />¥{e.price.toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <span>调味用量较小，未计入估算</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 步骤 */}
          <section className="mb-5">
            <h3 className="mb-2 font-display text-[1rem] tracking-tight">做法步骤</h3>
            <ol className="space-y-2">
              {recipe.steps.map((s, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg border border-border/60 bg-card/40 p-3 text-[13.5px] leading-relaxed"
                >
                  <span className="font-display text-[15px] text-primary num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* 多平台搜索入口 */}
          <section>
            <h3 className="mb-2 font-display text-[1rem] tracking-tight">看看别人怎么做</h3>
            <p className="mb-2 text-[11.5px] text-muted-foreground">
              三个入口都会在新窗口打开，搜索关键词「{recipe.videoQuery || `${recipe.name} 家常做法`}」。
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {searchEntries.map((e) => {
                const Icon = SEARCH_ICON[e.id] ?? ExternalLink;
                return (
                  <a
                    key={e.id}
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`detail-search-${e.id}-${recipe.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 transition-colors hover:border-primary/50 hover:bg-primary/10"
                  >
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-medium leading-tight">
                        {e.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{e.hint}</div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                );
              })}
            </div>
          </section>
        </div>

        <DialogFooter className="border-t border-border/60 bg-card/40 px-6 py-3 sm:px-7">
          <Button
            variant="outline"
            onClick={onToggleFav}
            data-testid={`button-toggle-fav-${recipe.id}`}
            className="w-full sm:w-auto"
          >
            <Heart className={`mr-1 h-4 w-4 ${fav ? "fill-rose-500 text-rose-500" : ""}`} />
            {fav ? "取消收藏" : "收藏这道菜"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="detail-close"
            className="w-full sm:w-auto"
          >
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
