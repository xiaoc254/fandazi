// 菜谱搜索面板：按 菜名 / 食材 / 口味 / 菜系 / 类目 / 难度 综合搜索。
// 支持「为什么匹配」高亮，命中规则可解释。

import { useMemo, useState } from "react";
import { Search, ChevronRight, X, Drumstick } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DishImage } from "@/components/DishImage";
import { DishPhoto } from "@/components/DishPhoto";
import { dishVisual } from "@/lib/dishVisual";
import {
  RECIPES,
  ALL_CUISINES,
  ALL_TASTES,
  ALL_CATEGORIES,
  ALL_RESTRICTIONS,
  type Recipe,
  type Cuisine,
  type Taste,
  type Category,
  type Restriction,
} from "@/data/recipes";

interface MatchResult {
  recipe: Recipe;
  reasons: string[];
  score: number;
}

// 食材偏好（与 Home 页的「想吃什么」对齐）— 用关键词做软筛选
const WISH_OPTIONS: { id: string; label: string; emoji: string; pattern: RegExp }[] = [
  { id: "beef", label: "牛肉", emoji: "🥩", pattern: /牛肉|牛腩|牛排|肥牛|雪花牛|牛筋|牛舌|牛尾/ },
  { id: "pork", label: "猪肉", emoji: "🥓", pattern: /猪肉|猪里脊|五花肉|排骨|里脊|梅花|肉末|肉丝|肉片|肉丁|叉烧|腊肉|腊肠|火腿|培根/ },
  { id: "chicken", label: "鸡肉", emoji: "🍗", pattern: /鸡肉|鸡胸|鸡腿|鸡翅|鸡丁|鸡丝|鸡块|鸡爪|三黄鸡/ },
  { id: "seafood", label: "鱼虾", emoji: "🍤", pattern: /虾|鱼(?!香)|蟹|贝|蛤|蛎|鱿|墨鱼|带鱼|鲈|鲫|草鱼|三文|鳕|黄鱼/ },
  { id: "tofu", label: "豆腐", emoji: "🟦", pattern: /豆腐|豆干|腐竹|豆皮|百叶/ },
  { id: "vegetable", label: "蔬菜", emoji: "🥬", pattern: /白菜|青菜|菠菜|生菜|包菜|油菜|空心菜|西兰花|花菜|芹菜|茄子|黄瓜|番茄|西红柿|胡萝卜|土豆|莲藕|蘑菇|香菇|青椒|彩椒|尖椒|豆角|玉米|冬瓜|丝瓜|南瓜|韭菜/ },
  { id: "noodle", label: "面食", emoji: "🍜", pattern: /面|粉条|粉丝|米线|河粉|馄饨|饺|包子|烧麦|饼|馍|年糕/ },
  { id: "rice", label: "米饭", emoji: "🍚", pattern: /米饭|炒饭|粥|焖饭|盖饭|拌饭|饭团|寿司|烩饭/ },
  { id: "dessert", label: "甜品", emoji: "🍰", pattern: /蛋糕|布丁|奶冻|双皮奶|果冻|月饼|糖水|甜品|糖醋|糖浆|蜂蜜|甜汤|蛋挞|奶茶|果汁/ },
];

function recipeBlob(r: Recipe): string {
  return `${r.name} ${r.ingredients.map((i) => i.name).join(" ")} ${r.steps.join(" ")}`;
}

function searchRecipes(
  q: string,
  cuisine: Cuisine | null,
  taste: Taste | null,
  category: Category | null,
  wishes: string[],
  excludes: Restriction[],
): MatchResult[] {
  const lower = q.trim().toLowerCase();
  const out: MatchResult[] = [];
  for (const r of RECIPES) {
    if (cuisine && r.cuisine !== cuisine) continue;
    if (taste && !r.tastes.includes(taste)) continue;
    if (category && r.category !== category) continue;
    // 排除忌口：硬过滤
    if (excludes.length > 0 && excludes.some((e) => r.contains.includes(e))) continue;
    // 排除「无辣」要单独判断（不是 contains 字段）
    if (excludes.includes("无辣") && r.tastes.some((t) => t === "微辣" || t === "重辣" || t === "麻辣")) continue;

    // 想吃什么：要求至少命中一个食材偏好
    if (wishes.length > 0) {
      const blob = recipeBlob(r);
      const hit = wishes.some((w) => {
        const opt = WISH_OPTIONS.find((o) => o.id === w);
        return opt ? opt.pattern.test(blob) : false;
      });
      if (!hit) continue;
    }

    const reasons: string[] = [];
    let score = 0;

    if (!lower) {
      // 没输入文字时，按筛选条件展示
      score += 1;
      if (cuisine) reasons.push(`${cuisine}`);
      if (taste) reasons.push(`${taste}`);
      if (category) reasons.push(`${category}`);
      if (wishes.length > 0) reasons.push(`含 ${wishes.map((w) => WISH_OPTIONS.find((o) => o.id === w)?.label).filter(Boolean).join("/")}`);
    } else {
      const name = r.name.toLowerCase();
      if (name.includes(lower)) {
        score += 5;
        reasons.push(`菜名命中「${q}」`);
      }
      if (r.cuisine.toLowerCase().includes(lower)) {
        score += 1;
        reasons.push(`菜系: ${r.cuisine}`);
      }
      const matchedIng = r.ingredients
        .map((i) => i.name)
        .filter((n) => n.toLowerCase().includes(lower));
      if (matchedIng.length > 0) {
        score += 3;
        reasons.push(`食材: ${matchedIng.slice(0, 2).join(" / ")}`);
      }
      const matchedTaste = r.tastes.filter((t) => t.toLowerCase().includes(lower));
      if (matchedTaste.length > 0) {
        score += 2;
        reasons.push(`口味: ${matchedTaste.join(" / ")}`);
      }
      if (r.category && r.category.toLowerCase().includes(lower)) {
        score += 2;
        reasons.push(`类目: ${r.category}`);
      }
      if (r.reason.toLowerCase().includes(lower)) {
        score += 1;
        reasons.push(`描述: ${r.reason.slice(0, 18)}…`);
      }
    }

    if (score > 0) out.push({ recipe: r, reasons, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

export function SearchPanel({
  onPickRecipe,
  realImagesEnabled,
}: {
  onPickRecipe: (r: Recipe) => void;
  realImagesEnabled: boolean;
}) {
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [taste, setTaste] = useState<Taste | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [wishes, setWishes] = useState<string[]>([]);
  const [excludes, setExcludes] = useState<Restriction[]>([]);

  const results = useMemo(
    () => searchRecipes(q, cuisine, taste, category, wishes, excludes),
    [q, cuisine, taste, category, wishes, excludes],
  );

  const hint =
    q.trim() === "" && !cuisine && !taste && !category && wishes.length === 0 && excludes.length === 0;

  const hasAnyFilter =
    !!cuisine || !!taste || !!category || wishes.length > 0 || excludes.length > 0;

  function clearAll() {
    setQ("");
    setCuisine(null);
    setTaste(null);
    setCategory(null);
    setWishes([]);
    setExcludes([]);
  }

  function toggleWish(id: string) {
    setWishes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleExclude(r: Restriction) {
    setExcludes((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  return (
    <section className="space-y-4" data-testid="search-panel">
      <header>
        <h2 className="font-display text-[1.6rem] tracking-tight">
          <Search className="mb-1 mr-1 inline h-5 w-5 text-primary" />
          菜谱搜索
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          按菜名 / 食材 / 口味 / 菜系 / 类目搜索，可叠加「想吃」与「避开」筛选 — 共 {RECIPES.length} 道菜可查。
        </p>
      </header>

      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5">
        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索菜名 / 食材 / 关键词，例如 牛肉、番茄、麻辣"
            data-testid="search-input"
            className="h-11 w-full rounded-full border border-border/70 bg-background/80 pl-9 pr-9 text-[14px] outline-none ring-primary/0 transition-shadow focus:ring-2 focus:ring-primary/30"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              data-testid="search-clear"
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 维度筛选 */}
        <div className="mt-3 space-y-2">
          <FilterRow
            label="菜系"
            options={ALL_CUISINES.map((c) => ({ id: c, label: c }))}
            selected={cuisine}
            onSelect={(v) => setCuisine(v as Cuisine | null)}
            testIdPrefix="filter-cuisine"
          />
          <FilterRow
            label="口味"
            options={ALL_TASTES.map((t) => ({ id: t, label: t }))}
            selected={taste}
            onSelect={(v) => setTaste(v as Taste | null)}
            testIdPrefix="filter-taste"
          />
          <FilterRow
            label="类目"
            options={ALL_CATEGORIES.map((c) => ({ id: c, label: c }))}
            selected={category}
            onSelect={(v) => setCategory(v as Category | null)}
            testIdPrefix="filter-category"
          />
          {/* 想吃什么（多选食材软筛选） */}
          <div className="flex flex-wrap items-center gap-1.5" data-testid="search-wishes">
            <span className="mr-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground">
              <Drumstick className="h-3 w-3" />
              想吃
            </span>
            {WISH_OPTIONS.map((w) => {
              const active = wishes.includes(w.id);
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => toggleWish(w.id)}
                  data-testid={`filter-wish-${w.id}`}
                  className={`inline-flex h-7 items-center gap-0.5 rounded-full border px-2.5 text-[11.5px] hover-elevate active-elevate-2 ${
                    active
                      ? "border-primary/55 bg-primary text-primary-foreground"
                      : "border-border bg-card/60 text-foreground/80"
                  }`}
                >
                  <span aria-hidden>{w.emoji}</span>
                  <span className="ml-0.5">{w.label}</span>
                </button>
              );
            })}
          </div>
          {/* 避开（多选忌口硬筛选） */}
          <div className="flex flex-wrap items-center gap-1.5" data-testid="search-excludes">
            <span className="mr-1 inline-flex items-center text-[11.5px] font-medium text-muted-foreground">
              避开
            </span>
            {ALL_RESTRICTIONS.map((r) => {
              const active = excludes.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleExclude(r)}
                  data-testid={`filter-exclude-${r}`}
                  className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11.5px] hover-elevate active-elevate-2 ${
                    active
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-800"
                      : "border-border bg-card/60 text-foreground/80"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
          {hasAnyFilter && (
            <button
              type="button"
              onClick={clearAll}
              data-testid="search-clear-all"
              className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-border/70 bg-background/60 px-2.5 text-[11px] text-muted-foreground hover-elevate"
            >
              <X className="h-3 w-3" />
              清除所有筛选
            </button>
          )}
        </div>

        {/* 结果列表 */}
        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between text-[12px] text-muted-foreground">
            <span>{hint ? "输入关键词或选择筛选项开始搜索" : `命中 ${results.length} 道`}</span>
          </div>

          {results.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-muted-foreground">
              没有找到匹配的菜，试着换个关键词或减少筛选条件。
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {results.slice(0, 30).map(({ recipe, reasons }) => {
                const visual = dishVisual(recipe.name, recipe.course, recipe.cuisine);
                return (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => onPickRecipe(recipe)}
                    data-testid={`search-result-${recipe.id}`}
                    className="group flex items-start gap-3 rounded-lg border border-border/60 bg-background/60 p-2 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                      {realImagesEnabled ? (
                        <DishPhoto
                          name={recipe.name}
                          visual={visual}
                          alt={recipe.name}
                          className="h-full w-full"
                          showSourceBadge={false}
                        />
                      ) : (
                        <DishImage visual={visual} alt={recipe.name} className="h-full w-full" name={recipe.name} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <h4 className="truncate font-display text-[14px] tracking-tight">
                          {recipe.name}
                        </h4>
                        <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                          {recipe.cuisine}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-muted-foreground num">
                        <span>{recipe.timeMinutes} 分钟</span>
                        <span>·</span>
                        <span>{recipe.difficulty}</span>
                        <span>·</span>
                        <span>{recipe.tastes.join("/")}</span>
                      </div>
                      {reasons.length > 0 && !hint && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {reasons.slice(0, 3).map((r, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-primary/10 px-1.5 py-0 text-[10px] text-primary"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                  </button>
                );
              })}
            </div>
          )}
          {results.length > 30 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              已展示前 30 道，可缩小关键词或加筛选条件继续筛。
            </p>
          )}
        </div>
      </Card>
    </section>
  );
}

interface RowProps<T extends string> {
  label: string;
  options: { id: T; label: string }[];
  selected: T | null;
  onSelect: (v: T | null) => void;
  testIdPrefix: string;
}

function FilterRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
  testIdPrefix,
}: RowProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 inline-flex items-center text-[11.5px] font-medium text-muted-foreground">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onSelect(null)}
        data-testid={`${testIdPrefix}-all`}
        className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11.5px] hover-elevate active-elevate-2 ${
          selected === null
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border bg-card/60 text-foreground/80"
        }`}
      >
        全部
      </button>
      {options.map((o) => {
        const active = selected === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelect(active ? null : o.id)}
            data-testid={`${testIdPrefix}-${o.id}`}
            className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11.5px] hover-elevate active-elevate-2 ${
              active
                ? "border-primary/55 bg-primary text-primary-foreground"
                : "border-border bg-card/60 text-foreground/80"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
