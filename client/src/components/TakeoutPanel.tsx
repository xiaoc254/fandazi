// 外卖优惠面板（升级版）：
//  - 输入：城市 + 总预算 + 人数 + 口味偏好 + 时段 + 是否减脂
//  - 输出：「替你决定」一个特别推荐品牌 + 备选 3-5 + 平台搜索入口 + 凑券 / 风险提示
//  - 数据：static brands（含全国连锁），不抓取任何商户 / 平台 API。
//  - 性能：只渲染特别推荐 + 4 个备选；详细菜单折叠展示。

import { useMemo, useState } from "react";
import {
  Bike,
  Wallet,
  Sparkles,
  Users,
  AlertTriangle,
  ExternalLink,
  ChefHat,
  Receipt,
  ShoppingBag,
  Flame,
  RefreshCw,
  Search,
  X,
  MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BUDGETS, PLATFORMS, type BudgetId } from "@/data/takeout";
import {
  pickTakeout,
  TAKEOUT_BRANDS,
  HOT_TAKEOUT_BRANDS,
  findBrandByQuery,
  searchBrands,
  type TakeoutBrand,
  type TakeoutTaste,
} from "@/data/takeoutBrands";
import {
  coverageTone,
  localHotBrandNames,
  localTakeoutDishes,
  type CoverageMatch,
} from "@/lib/takeoutCoverage";
import { findProvinceByCity } from "@/lib/regions";

const COMMON_CITIES = [
  "北京", "上海", "广州", "深圳", "杭州", "成都", "重庆", "武汉",
  "南京", "西安", "苏州", "天津", "长沙", "郑州", "青岛", "厦门", "其他",
];

const TASTE_OPTIONS: { id: TakeoutTaste; label: string }[] = [
  { id: "辣", label: "辣" },
  { id: "清淡", label: "清淡" },
  { id: "甜", label: "甜口" },
  { id: "咸鲜", label: "咸鲜" },
  { id: "酸辣", label: "酸辣" },
  { id: "热量低", label: "低卡" },
];

const SLOTS: { id: "breakfast" | "lunch" | "dinner" | "midnight"; label: string; emoji: string }[] = [
  { id: "breakfast", label: "早餐", emoji: "🌄" },
  { id: "lunch", label: "午餐", emoji: "🌞" },
  { id: "dinner", label: "晚餐", emoji: "🌆" },
  { id: "midnight", label: "夜宵", emoji: "🌙" },
];

function BrandVisual({ brand }: { brand: TakeoutBrand }) {
  const first = (brand.name || "").trim().charAt(0) || brand.emoji;
  return (
    <div
      className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl shadow-sm sm:h-[68px] sm:w-[68px]"
      style={{ background: `linear-gradient(135deg, ${brand.gradient[0]}, ${brand.gradient[1]})` }}
      aria-hidden
    >
      <span className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.45), transparent 60%)" }} />
      <span className="relative flex h-full w-full items-center justify-center font-display text-[1.95rem] font-semibold text-white drop-shadow-md">
        {first}
      </span>
      <span className="absolute right-1 top-1 text-[16px] drop-shadow">{brand.emoji}</span>
    </div>
  );
}

function BrandCard({
  brand,
  special,
  defaultOpen,
  coverage,
}: {
  brand: TakeoutBrand;
  special?: boolean;
  defaultOpen?: boolean;
  /** v12: 该品牌在当前城市/省份的覆盖判定 */
  coverage?: CoverageMatch;
}) {
  const [open, setOpen] = useState<boolean>(!!defaultOpen);
  return (
    <Card
      className={`grain p-3 ${
        special ? "border-primary/50 bg-primary/5" : "border-card-border/60 bg-card/70"
      }`}
      data-testid={`takeout-brand-${brand.id}`}
    >
      <div className="flex items-start gap-3">
        <BrandVisual brand={brand} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="truncate font-display text-[16px] tracking-tight">{brand.name}</h4>
            {special && (
              <Badge className="rounded-full bg-primary text-primary-foreground" data-testid="takeout-special-badge">
                <Sparkles className="mr-0.5 h-3 w-3" /> 替你决定
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10.5px]">
              {brand.category}
            </Badge>
            <span className="num">¥{brand.budgetMin}-{brand.budgetMax} / 人</span>
            <span className="num inline-flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {brand.peopleMin}-{brand.peopleMax} 人
            </span>
            {coverage ? (
              <Badge
                variant="outline"
                className={`rounded-full px-1.5 py-0 text-[10.5px] ${coverageTone(coverage.level)}`}
                title={coverage.reason}
                data-testid={`takeout-coverage-${brand.id}`}
              >
                <MapPin className="mr-0.5 h-2.5 w-2.5" />
                {coverage.label}
              </Badge>
            ) : (
              <span>{brand.citySpread}</span>
            )}
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/85">
            {brand.intro}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {brand.tastes.map((t) => (
              <Badge key={t} variant="secondary" className="rounded-full px-1.5 py-0 text-[10.5px]">
                {t}
              </Badge>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-2 inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
            data-testid={`takeout-detail-toggle-${brand.id}`}
          >
            {open ? "收起" : "展开"}招牌菜单与凑券提示
          </button>

          {open && (
            <div className="mt-2 space-y-2">
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-muted-foreground">招牌 / 推荐菜单</p>
                <ul className="space-y-1">
                  {brand.picks.map((p) => (
                    <li
                      key={p.name}
                      className="rounded-md border border-border/50 bg-background/60 px-2 py-1.5 text-[12.5px]"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{p.name}</span>
                        {p.price && <span className="num text-muted-foreground">{p.price}</span>}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {p.cal && (
                          <span className="num inline-flex items-center gap-0.5">
                            <Flame className="h-3 w-3 text-primary/80" />
                            {p.cal}
                          </span>
                        )}
                        {p.note && <span>{p.note}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                <p className="rounded-md bg-emerald-50 px-2 py-1.5 text-[11.5px] text-emerald-800">
                  <Receipt className="mr-1 inline h-3 w-3" />
                  {brand.couponHint}
                </p>
                <p className="rounded-md bg-amber-50 px-2 py-1.5 text-[11.5px] text-amber-800">
                  <Flame className="mr-1 inline h-3 w-3" />
                  {brand.calorieHint}
                </p>
              </div>
            </div>
          )}

          {/* 平台搜索入口 */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PLATFORMS.slice(0, 4).map((p) => (
              <a
                key={p.id}
                href={p.buildSearch(brand.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] text-primary hover-elevate active-elevate-2"
                data-testid={`takeout-platform-${brand.id}-${p.id}`}
              >
                <ExternalLink className="h-3 w-3" />
                {p.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function TakeoutPanel() {
  // 智能推荐参数
  const [city, setCity] = useState<string>("北京");
  const [budget, setBudget] = useState<number>(40); // 总预算
  const [people, setPeople] = useState<number>(1);
  const [tastes, setTastes] = useState<TakeoutTaste[]>([]);
  const [slot, setSlot] = useState<"breakfast" | "lunch" | "dinner" | "midnight" | undefined>("lunch");
  const [lowCalorie, setLowCalorie] = useState<boolean>(false);
  const [nonce, setNonce] = useState(0);

  // v12: 城市 → 省份/大区，用于按地区筛选「本城点得到」的品牌
  const provinceDef = useMemo(() => findProvinceByCity(city), [city]);
  const province = provinceDef?.province;
  const localHots = useMemo(
    () => localHotBrandNames(TAKEOUT_BRANDS, city, province, 10),
    [city, province],
  );
  const localDishes = useMemo(() => localTakeoutDishes(city, province), [city, province]);

  // 旧的「按预算档位」分区（保留作为备选 / 凑券提醒）
  const [budgetTier, setBudgetTier] = useState<BudgetId>("b25-40");
  const tier = useMemo(
    () => BUDGETS.find((b) => b.id === budgetTier) ?? BUDGETS[2],
    [budgetTier],
  );

  // v4: 品牌搜索 + 热门 chip 置顶
  const [pinnedBrandId, setPinnedBrandId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const searchHits = useMemo(() => searchBrands(searchQuery, 8), [searchQuery]);

  const result = useMemo(
    () => pickTakeout({ city, province, budget, people, tastes, slot, lowCalorie, pinnedBrandId, searchQuery: pinnedBrandId ? undefined : searchQuery }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [city, province, budget, people, tastes, slot, lowCalorie, nonce, pinnedBrandId, searchQuery],
  );

  function pinByLabel(label: string) {
    const b = findBrandByQuery(label);
    if (b) {
      setPinnedBrandId(b.id);
      setSearchQuery("");
    }
  }
  function clearPin() {
    setPinnedBrandId(undefined);
    setSearchQuery("");
  }

  return (
    <section className="space-y-4" data-testid="takeout-panel">
      <header>
        <h2 className="font-display text-[1.7rem] tracking-tight">
          <Bike className="mb-1 mr-1 inline h-5 w-5 text-primary" />
          今天外卖吃什么
        </h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          告诉我们城市 / 预算 / 人数 / 口味，「替你决定」选一个全国连锁品牌 + 备选 · 不实时读取平台数据
        </p>
      </header>

      {/* 输入参数 */}
      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5">
        <div className="space-y-3">
          {/* 城市 */}
          <div>
            <p className="mb-1 text-[12px] font-medium text-foreground/80">
              城市
              <span className="ml-1.5 font-normal text-muted-foreground" data-testid="takeout-region-hint">
                {provinceDef ? `· ${provinceDef.province} / ${provinceDef.region}` : "· 未识别省份，按全国连锁推荐"}
              </span>
            </p>
            <div className="flex flex-wrap gap-1" data-testid="takeout-cities">
              {COMMON_CITIES.map((c) => {
                const active = city === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80 hover-elevate"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 预算 + 人数 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[12px] font-medium text-foreground/80">
                <Wallet className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" />
                总预算（含配送费）
              </p>
              <div className="flex flex-wrap gap-1" data-testid="takeout-budgets">
                {[15, 25, 40, 60, 100, 150].map((b) => {
                  const active = budget === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudget(b)}
                      className={`rounded-full border px-2.5 py-1 text-[12.5px] num transition-colors ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80 hover-elevate"
                      }`}
                      data-testid={`takeout-budget-${b}`}
                    >
                      ¥{b}
                    </button>
                  );
                })}
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value) || 40)}
                  className="w-20 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[12.5px] num"
                  aria-label="自定义预算"
                />
              </div>
            </div>
            <div>
              <p className="mb-1 text-[12px] font-medium text-foreground/80">
                <Users className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" />
                人数
              </p>
              <div className="flex flex-wrap gap-1" data-testid="takeout-people">
                {[1, 2, 3, 4, 5, 6].map((n) => {
                  const active = people === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPeople(n)}
                      className={`rounded-full border px-2.5 py-1 text-[12.5px] num transition-colors ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80 hover-elevate"
                      }`}
                    >
                      {n} 人
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 口味 */}
          <div>
            <p className="mb-1 text-[12px] font-medium text-foreground/80">口味偏好（多选 / 留空不限）</p>
            <div className="flex flex-wrap gap-1" data-testid="takeout-tastes">
              {TASTE_OPTIONS.map((t) => {
                const active = tastes.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setTastes((p) => (p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id]))
                    }
                    className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                      active ? "border-primary bg-primary/15 text-primary" : "border-border bg-card/60 text-foreground/80 hover-elevate"
                    }`}
                    data-testid={`takeout-taste-${t.id}`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 时段 + 减脂 */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="mb-1 text-[12px] font-medium text-foreground/80">时段</p>
              <div className="flex flex-wrap gap-1">
                {SLOTS.map((s) => {
                  const active = slot === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlot(s.id)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80 hover-elevate"
                      }`}
                    >
                      <span aria-hidden>{s.emoji}</span>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-[12.5px]">
              <input
                type="checkbox"
                checked={lowCalorie}
                onChange={(e) => setLowCalorie(e.target.checked)}
                className="accent-primary"
                data-testid="takeout-low-cal"
              />
              减脂友好优先
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setNonce((n) => n + 1)}
              className="h-8 rounded-full text-[12px]"
              data-testid="takeout-refresh"
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> 换一批
            </Button>
          </div>
        </div>
      </Card>

      {/* v4: 品牌搜索 + 热门连锁 chips */}
      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5" data-testid="takeout-brand-find">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="font-display text-[1.05rem] tracking-tight">
            <Search className="mb-0.5 mr-1 inline h-4 w-4 text-primary" />
            搜真实品牌 / 热门连锁
          </h3>
          <span className="text-[11px] text-muted-foreground">点 chip 把品牌置顶为「替你决定」</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              placeholder="搜：达美乐 / 牛约堡 / 正新鸡排 / 肯德基..."
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (pinnedBrandId) setPinnedBrandId(undefined);
              }}
              className="w-full rounded-full border border-border bg-background/60 py-1.5 pl-7 pr-8 text-[13px] focus:border-primary/50 focus:outline-none"
              data-testid="takeout-brand-search"
              aria-label="搜索外卖品牌"
            />
            {(searchQuery || pinnedBrandId) && (
              <button
                type="button"
                onClick={clearPin}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover-elevate"
                data-testid="takeout-brand-clear"
                aria-label="清除搜索/置顶"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        {searchQuery && searchHits.length > 0 && !pinnedBrandId && (
          <div className="mt-2 flex flex-wrap gap-1.5" data-testid="takeout-brand-search-hits">
            {searchHits.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setPinnedBrandId(b.id)}
                className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[12px] text-primary hover-elevate active-elevate-2"
                data-testid={`takeout-brand-hit-${b.id}`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}
        {searchQuery && searchHits.length === 0 && !pinnedBrandId && (
          <p className="mt-2 text-[12px] text-muted-foreground">
            未在真实品牌池命中「{searchQuery}」 — 可改用下方热门 chip。
          </p>
        )}
        <div className="mt-3">
          <p className="mb-1 text-[11.5px] text-muted-foreground">热门真实品牌（点击置顶）</p>
          <div className="flex flex-wrap gap-1.5" data-testid="takeout-hot-chips">
            {HOT_TAKEOUT_BRANDS.map((h) => {
              const target = findBrandByQuery(h.matchName);
              const active = !!target && pinnedBrandId === target.id;
              return (
                <button
                  key={h.label}
                  type="button"
                  onClick={() => pinByLabel(h.matchName)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors hover-elevate active-elevate-2 ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card/60 text-foreground/85"
                  }`}
                  data-testid={`takeout-hot-${h.label}`}
                  disabled={!target}
                  title={target ? `置顶 ${target.name}` : "品牌池暂无该品牌"}
                >
                  {h.label}
                </button>
              );
            })}
          </div>
        </div>
        {result.budgetWarn && (
          <p className="mt-2 inline-flex items-start gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11.5px] text-amber-700" data-testid="takeout-budget-warn">
            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
            {result.budgetWarn}
          </p>
        )}
      </Card>

      {/* v12: 本地能点到的连锁 —— 按城市/省份从品牌池筛出「本城常见」的区域品牌 */}
      {localHots.length > 0 && (
        <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5" data-testid="takeout-local-hots">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="font-display text-[1.05rem] tracking-tight">
              <MapPin className="mb-0.5 mr-1 inline h-4 w-4 text-primary" />
              {city}本地能点到
            </h3>
            <span className="text-[11px] text-muted-foreground">
              按 {provinceDef?.province ?? city} 门店覆盖筛出 · 点 chip 置顶
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {localHots.map((b) => {
              const active = pinnedBrandId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setPinnedBrandId(b.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors hover-elevate active-elevate-2 ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card/60 text-foreground/85"
                  }`}
                  data-testid={`takeout-local-${b.id}`}
                  title={`${b.name} · ${b.category} · ${city}常见门店`}
                >
                  <span aria-hidden>{b.emoji}</span>
                  {b.name}
                </button>
              );
            })}
          </div>
          {localDishes && (
            <p className="mt-2 text-[11.5px] text-muted-foreground" data-testid="takeout-local-dishes">
              {localDishes.city}本地口味：{localDishes.items.slice(0, 4).map((i) => i.name).join(" / ")}
              {localDishes.vibe ? ` · ${localDishes.vibe}` : ""}
            </p>
          )}
        </Card>
      )}

      {/* 替你决定 */}
      <div>
        <p className="mb-2 text-[12.5px] text-primary/80" data-testid="takeout-decision">
          {result.decisionLine} · 城市：{city} · 人均 ¥{result.perPerson}
        </p>
        <p className="mb-2 text-[11.5px] text-muted-foreground" data-testid="takeout-balance-hint">
          品类平衡：正餐优先，饮品/咖啡不刷屏（除非选择「早餐」/「下午茶」时段或主动搜索咖啡品牌）
        </p>
        {result.coverageById[result.special.id] && (
          <p className="mb-2 text-[11.5px] text-emerald-700" data-testid="takeout-coverage-reason">
            <MapPin className="mr-0.5 inline h-3 w-3" />
            {result.coverageById[result.special.id].reason}
          </p>
        )}
        <BrandCard
          brand={result.special}
          special
          defaultOpen
          coverage={result.coverageById[result.special.id]}
        />
      </div>

      {/* 备选 */}
      <div>
        <h3 className="mb-2 font-display text-[1.05rem] tracking-tight">
          <ChefHat className="mb-0.5 mr-1 inline h-4 w-4 text-primary" />
          其它候选 · {result.alternatives.length} 个
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {result.alternatives.map((b) => (
            <BrandCard key={b.id} brand={b} coverage={result.coverageById[b.id]} />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          连锁品牌库内置 {TAKEOUT_BRANDS.length} 家 · 不实时读取美团 / 饿了么 / 抖音内部数据 · 商标版权归各品牌所有
        </p>
      </div>

      {/* 凑券档位（保留旧版） */}
      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5">
        <h3 className="mb-3 font-display text-[1.1rem] tracking-tight">
          <Wallet className="mb-0.5 mr-1 inline h-4 w-4 text-primary" />
          按预算档位看凑券
        </h3>
        <div
          className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
          data-testid="budget-tabs"
        >
          {BUDGETS.map((b) => {
            const active = b.id === budgetTier;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBudgetTier(b.id)}
                data-testid={`budget-${b.id}`}
                className={`inline-flex w-full items-center gap-2 rounded-full border px-3 py-2 text-[13px] font-medium transition-colors hover-elevate active-elevate-2 sm:w-auto ${
                  active
                    ? "border-primary/55 bg-primary text-primary-foreground"
                    : "border-border bg-card/60 text-foreground/90"
                }`}
              >
                <span aria-hidden>💴</span>
                <span>{b.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <h4 className="mb-1 text-[12px] font-semibold text-emerald-700">怎么凑券</h4>
            <ul className="space-y-1 text-[12.5px] text-foreground/85">
              {tier.coupon.map((c, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-600" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <h4 className="mb-1 text-[12px] font-semibold text-amber-800">风险与提醒</h4>
            <ul className="space-y-1 text-[12.5px] text-foreground/85">
              {tier.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-700" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* 平台搜索 */}
      <Card className="border-card-border/60 bg-card/60 p-4 sm:p-5">
        <h3 className="mb-3 font-display text-[1.1rem] tracking-tight">
          <ShoppingBag className="mb-0.5 mr-1 inline h-4 w-4 text-primary" />
          各平台搜索入口
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {PLATFORMS.map((p) => {
            const q = result.special.name;
            return (
              <a
                key={p.id}
                href={p.buildSearch(q)}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`takeout-platform-${p.id}`}
                title={`在 ${p.label} 搜索「${q}」` + (p.needsLogin ? " · 可能需登录" : "")}
                className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-[13.5px] transition-colors hover-elevate active-elevate-2"
              >
                <span className="flex flex-col">
                  <span className="font-medium text-primary">{p.label}</span>
                  <span className="text-[11.5px] text-muted-foreground">
                    {p.hint}
                    {p.needsLogin && (
                      <Badge
                        variant="outline"
                        className="ml-1 rounded-full border-amber-500/40 px-1 py-0 text-[9.5px] text-amber-700"
                      >
                        需登录
                      </Badge>
                    )}
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 flex-shrink-0 text-primary" />
              </a>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
