// 旅行美食面板：选省份 → 城市 → 看当地特色食物 + 第三方搜索入口。
// 不接商户 API，仅给出搜索 URL，避免反爬 / 版权风险。
// 数据来源：编辑整理的内置 cityFoods（约 50 个城市）。

import { useMemo, useState } from "react";
import {
  Plane,
  Search,
  ExternalLink,
  Sparkles,
  MapPin,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CityFoodImage } from "@/components/CityFoodImage";
import {
  CITY_FOODS,
  ALL_PROVINCES,
  citiesGroupedByProvince,
  searchCities,
  type CityFood,
} from "@/data/cityFoods";

interface TravelLink {
  id: string;
  label: string;
  build: (q: string) => string;
  hint?: string;
}

// 大众点评 m.dianping.com / dianping.com 直链多次实测会跳 error_page，已统一改成
// 「百度站内 site:dianping.com」做主入口（稳定、不会 404）。
function dianpingBaiduUrl(q: string): string {
  return `https://www.baidu.com/s?wd=${encodeURIComponent(q + " site:dianping.com")}`;
}

const LINKS: TravelLink[] = [
  { id: "baidu", label: "百度", build: (q: string) => `https://www.baidu.com/s?wd=${encodeURIComponent(q + " 推荐 美食")}` },
  { id: "douyin", label: "抖音", build: (q: string) => `https://www.douyin.com/search/${encodeURIComponent(q + " 美食")}` },
  { id: "xhs", label: "小红书", build: (q: string) => `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(q)}` },
  {
    id: "dp",
    label: "大众点评（百度站内）",
    build: dianpingBaiduUrl,
    hint: "稳定入口",
  },
];

export function TravelPanel() {
  const [q, setQ] = useState("");
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string>(CITY_FOODS[0].city);

  const allFiltered = useMemo(() => searchCities(q), [q]);
  // 在搜索 + 省份筛选后的最终城市列表
  const filtered = useMemo(() => {
    if (!activeProvince) return allFiltered;
    return allFiltered.filter((c) => c.province === activeProvince);
  }, [allFiltered, activeProvince]);

  const grouped = useMemo(() => citiesGroupedByProvince(), []);
  // 当前 province 是否仍存在于搜索结果里；如果筛 0 城市，自动清空 province
  const provinceInResults = useMemo(() => {
    const set = new Set(allFiltered.map((c) => c.province));
    return ALL_PROVINCES.filter((p) => set.has(p));
  }, [allFiltered]);

  const city: CityFood =
    filtered.find((c) => c.city === activeCity) ?? filtered[0] ?? CITY_FOODS[0];

  const totalCities = CITY_FOODS.length;
  const totalProvinces = ALL_PROVINCES.length;

  return (
    <section className="space-y-4" data-testid="travel-panel">
      <header>
        <h2 className="font-display text-[1.6rem] tracking-tight">
          <Plane className="mb-1 mr-1 inline h-5 w-5 text-primary" />
          外出旅游吃什么
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          按省份 / 城市浏览特色美食 — 内置 {totalProvinces} 个省级行政区、{totalCities} 个城市。
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
            placeholder="搜索省份 / 城市 / 美食，例如 成都、广东、川菜、烧麦"
            data-testid="travel-search"
            className="h-11 w-full rounded-full border border-border/70 bg-background/80 pl-9 pr-9 text-[14px] outline-none transition-shadow focus:ring-2 focus:ring-primary/30"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              data-testid="travel-search-clear"
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 省份选择条 */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground">
              <MapPin className="h-3 w-3" />
              省份 / 直辖市
            </span>
            <span className="num text-[11px] text-muted-foreground">
              {filtered.length}/{totalCities} 城市
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5" data-testid="province-list">
            <button
              type="button"
              onClick={() => setActiveProvince(null)}
              data-testid="province-all"
              className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11.5px] hover-elevate active-elevate-2 ${
                activeProvince === null
                  ? "border-primary/55 bg-primary text-primary-foreground"
                  : "border-border bg-card/60 text-foreground/80"
              }`}
            >
              全部
            </button>
            {provinceInResults.map((p) => {
              const active = p === activeProvince;
              const count = allFiltered.filter((c) => c.province === p).length;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActiveProvince(active ? null : p)}
                  data-testid={`province-${p}`}
                  className={`inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11.5px] hover-elevate active-elevate-2 ${
                    active
                      ? "border-primary/55 bg-primary text-primary-foreground"
                      : "border-border bg-card/60 text-foreground/80"
                  }`}
                >
                  {p}
                  <span className={`num text-[10px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    · {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 城市筛选 chip */}
        <div className="mt-3 flex flex-wrap gap-1.5" data-testid="city-list">
          {filtered.slice(0, 80).map((c) => {
            const active = c.city === city.city;
            return (
              <button
                key={c.city}
                type="button"
                onClick={() => setActiveCity(c.city)}
                data-testid={`city-${c.city}`}
                className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11.5px] hover-elevate active-elevate-2 ${
                  active
                    ? "border-primary/55 bg-primary text-primary-foreground"
                    : "border-border bg-card/60 text-foreground/80"
                }`}
              >
                {c.city}
                {c.cuisine && (
                  <span className={`ml-1 text-[10px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    · {c.cuisine}
                  </span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-2 text-[12px] text-muted-foreground">
              没有找到匹配的城市，换个关键词或清除省份筛选。
            </p>
          )}
        </div>

        {/* 城市详情 */}
        {filtered.length > 0 && city && (
          <div className="mt-5 space-y-3" data-testid={`city-detail-${city.city}`}>
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="font-display text-[1.3rem] tracking-tight">{city.city}</h3>
              <Badge variant="outline" className="rounded-full px-2 text-[11px]">
                {city.province}
              </Badge>
              {city.cuisine && (
                <Badge variant="outline" className="rounded-full px-2 text-[11px]">
                  {city.cuisine}
                </Badge>
              )}
              <span className="num ml-auto text-[10.5px] text-muted-foreground">
                {city.items.length} 道
              </span>
            </div>
            <p className="rounded-md border border-primary/20 bg-primary/5 p-2 text-[12.5px] leading-relaxed text-foreground/85">
              <Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary" />
              {city.vibe}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {city.items.map((item) => (
                <div
                  key={item.name}
                  className="overflow-hidden rounded-lg border border-border/60 bg-background/60"
                  data-testid={`city-food-${city.city}-${item.name}`}
                >
                  {/* 图片区：复用 imageProvider；失败回落到渐变 + emoji 占位 */}
                  <CityFoodImage
                    query={`${city.city} ${item.name}`}
                    name={item.name}
                    tag={item.tags?.join(" ")}
                    className="aspect-[16/9] w-full"
                  />
                  <div className="p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-display text-[15px] tracking-tight">{item.name}</h4>
                      {item.tags && item.tags.length > 0 && (
                        <span className="flex flex-wrap gap-1">
                          {item.tags.map((t) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="rounded-full bg-primary/10 px-1.5 py-0 text-[10.5px] text-primary"
                            >
                              {t}
                            </Badge>
                          ))}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {LINKS.map((l) => (
                        <a
                          key={l.id}
                          href={l.build(`${city.city} ${item.name}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`travel-link-${city.city}-${item.name}-${l.id}`}
                          title={l.hint ?? `在 ${l.label} 搜索 ${city.city} ${item.name}`}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] text-primary hover-elevate active-elevate-2"
                        >
                          {l.label}
                          {l.hint && (
                            <span className="text-muted-foreground">· {l.hint}</span>
                          )}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10.5px] text-muted-foreground">
              数据为编辑整理的特色清单，搜索入口仅跳转至第三方关键词页面，不抓取任何商户 / 实时信息。
            </p>
          </div>
        )}
      </Card>

      {/* 省份地图概览 — 没有搜索输入时显示，便于快速浏览全部地域 */}
      {!q && (
        <Card className="border-card-border/60 bg-card/60 p-4 sm:p-5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="font-display text-[1.05rem] tracking-tight">
              <MapPin className="mb-0.5 mr-1 inline h-4 w-4 text-primary" />
              全国概览
            </h3>
            <span className="text-[11px] text-muted-foreground num">
              {totalProvinces} 省 / {totalCities} 城
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="province-grid">
            {grouped.map(({ province, cities }) => (
              <div
                key={province}
                className="rounded-lg border border-border/60 bg-background/40 p-2.5"
                data-testid={`province-block-${province}`}
              >
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="font-display text-[12.5px] tracking-tight text-foreground/85">
                    {province}
                  </span>
                  <span className="num text-[10px] text-muted-foreground">
                    {cities.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cities.map((c) => (
                    <button
                      key={c.city}
                      type="button"
                      onClick={() => {
                        setActiveProvince(province);
                        setActiveCity(c.city);
                      }}
                      data-testid={`province-${province}-city-${c.city}`}
                      className="inline-flex h-6 items-center rounded-full border border-border/60 bg-card/60 px-2 text-[10.5px] text-foreground/80 hover-elevate active-elevate-2"
                    >
                      {c.city}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </section>
  );
}
