// 饭桌热榜：实时热搜聚合 + 屏蔽开关 + 视觉卡片。
// 数据来源：lib/hotBoard.ts（多源 fallback + 静态兜底）。
// 注意：所有外链都用 noopener noreferrer + target=_blank，避免劫持。
import { useEffect, useState, useMemo } from "react";
import { Flame, Shield, ShieldOff, RefreshCw, ExternalLink, Search, AlertTriangle, Sparkles, Loader2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HOT_SOURCE_META,
  loadHotBoardSettings,
  saveHotBoardSettings,
  loadSource,
  applySensitiveFilter,
  baiduUrlFor,
  searchUrlFor,
  currentMonth,
  MONTH_THEMES,
  type HotItem,
  type HotSource,
} from "@/lib/hotBoard";

const SOURCES: HotSource[] = ["weibo", "baidu", "douyin", "zhihu", "bilibili", "toutiao"];

function formatHot(n?: number): string {
  if (typeof n !== "number" || !isFinite(n)) return "";
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)} 亿`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)} 万`;
  return String(n);
}

export function HotBoard() {
  const [settings, setSettings] = useState(() => loadHotBoardSettings());
  const [items, setItems] = useState<HotItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [live, setLive] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  // v8: 每次刷新 seed+1，离线 fallback 路径下让内容真的轮换；平台间 phrasing 也保留差异。
  const [seed, setSeed] = useState<number>(0);

  async function refresh(source: HotSource = settings.source, opts?: { bumpSeed?: boolean }) {
    const nextSeed = opts?.bumpSeed ? seed + 1 : seed;
    if (opts?.bumpSeed) setSeed(nextSeed);
    setLoading(true);
    setError(undefined);
    try {
      // 用户主动「刷新」：如果之前是 live，再尝试一次 live；否则保持 offline 走 seed 切换
      const r = await loadSource(source, { seed: nextSeed, offline: opts?.bumpSeed && !live });
      setItems(r.items);
      setLive(r.live);
      if (!r.live) setError(r.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(settings.source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.source]);

  function toggleBlock(v: boolean) {
    const next = { ...settings, blockSensitive: v };
    setSettings(next);
    saveHotBoardSettings(next);
  }

  function pickSource(s: HotSource) {
    if (s === settings.source) return;
    const next = { ...settings, source: s };
    setSettings(next);
    saveHotBoardSettings(next);
  }

  const visible = useMemo(
    () =>
      applySensitiveFilter(items, settings.blockSensitive).slice(
        0,
        // 关闭屏蔽时多放几条，让差异肉眼可见
        settings.blockSensitive ? 10 : 14,
      ),
    [items, settings.blockSensitive],
  );
  const blockedCount = useMemo(
    () => (settings.blockSensitive ? items.filter((i) => i.flagged).length : 0),
    [items, settings.blockSensitive],
  );
  const sourceMeta = HOT_SOURCE_META[settings.source];

  return (
    <section id="hotboard-section" className="mt-10 scroll-mt-20" data-testid="section-hotboard">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-[1.4rem] tracking-tight">
            <Flame className="mb-1 mr-1 inline h-5 w-5 text-primary" />
            饭桌热榜
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            实时聚合 6 个平台的热点 · 每个平台调性不同 · 一键屏蔽争议话题
          </p>
          <p className="mt-0.5 text-[11px] text-primary/80" data-testid="hotboard-month-hint">
            离线时按当前月份 + 平台风格推荐话题（{MONTH_THEMES[currentMonth()].label}）— 不是实时热搜，刷新可换内容
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => refresh(settings.source, { bumpSeed: true })}
          data-testid="button-refresh-hotboard"
          className="rounded-full"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1 text-[12px]">刷新</span>
        </Button>
      </div>

      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5">
        {/* Tabs */}
        <div className="mb-3 flex flex-wrap gap-1.5" data-testid="hotboard-source-tabs">
          {SOURCES.map((s) => {
            const meta = HOT_SOURCE_META[s];
            const active = s === settings.source;
            return (
              <button
                key={s}
                type="button"
                onClick={() => pickSource(s)}
                data-testid={`hotboard-tab-${s}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors hover-elevate active-elevate-2 ${
                  active
                    ? "border-primary/50 bg-primary text-primary-foreground"
                    : "border-border bg-background/60 text-foreground/80"
                }`}
              >
                <span aria-hidden>{meta.emoji}</span>
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* 屏蔽开关 + 状态 */}
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-[12px]">
          <label className="inline-flex cursor-pointer items-center gap-2" data-testid="switch-block-sensitive-label">
            {settings.blockSensitive ? (
              <Shield className="h-3.5 w-3.5 text-primary" />
            ) : (
              <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="font-medium">屏蔽争议 / 敏感话题</span>
            <Switch
              checked={settings.blockSensitive}
              onCheckedChange={toggleBlock}
              data-testid="switch-block-sensitive"
            />
          </label>
          <span
            className={`inline-flex items-center gap-1 ${
              settings.blockSensitive
                ? "text-primary/80"
                : "text-amber-700"
            }`}
            data-testid="hotboard-block-status"
          >
            {settings.blockSensitive ? (
              <>
                <Shield className="h-3 w-3" /> 已屏蔽 {blockedCount} 条
                {blockedCount > 0 && (
                  <span className="text-muted-foreground">·饭桌不友好的话题</span>
                )}
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" /> 已显示全部热搜（含争议话题）
              </>
            )}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            {live ? (
              <Badge variant="outline" className="rounded-full border-primary/40 px-2 py-0 text-[10.5px] text-primary">
                实时 · {sourceMeta.label}
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full border-border/60 bg-background/60 px-2 py-0 text-[10.5px] text-muted-foreground">
                内置精选 · {sourceMeta.label}
              </Badge>
            )}
          </span>
        </div>

        {/* 列表 */}
        {loading && visible.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> 正在加载{sourceMeta.label}热榜…
          </div>
        ) : visible.length === 0 ? (
          <div className="py-6 text-center text-[12px] text-muted-foreground" data-testid="hotboard-empty">
            <AlertTriangle className="mx-auto mb-2 h-4 w-4" />
            屏蔽后没有可展示话题。试试关闭屏蔽 / 切换平台。
          </div>
        ) : (
          <ol className="space-y-2" data-testid="hotboard-list">
            {visible.map((it, idx) => {
              const v = it.visual!;
              const rank = idx + 1;
              // 取标题首字（中文优先），没有则平台 emoji
              const firstChar = (it.title || "").trim().charAt(0) || v.emoji;
              const isTopRank = rank <= 3;
              return (
                <li
                  key={it.id}
                  data-testid={`hotboard-item-${idx}`}
                  className="group relative overflow-hidden rounded-xl border border-border/60 bg-background/60 p-3 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-stretch gap-3">
                    {/* 视觉卡：渐变 + 大号首字 + 平台徽章 + 排名 + 微纹理 */}
                    <div
                      className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl shadow-sm sm:h-[68px] sm:w-[68px]"
                      style={{
                        background: `linear-gradient(135deg, ${v.gradient[0]} 0%, ${v.gradient[1]} 100%)`,
                      }}
                      aria-hidden
                      data-testid={`hotboard-visual-${idx}`}
                    >
                      {/* 高光斑 */}
                      <span
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.42), transparent 60%)",
                        }}
                      />
                      {/* 微点阵纹理 */}
                      <span
                        className="pointer-events-none absolute inset-0 opacity-[0.18]"
                        style={{
                          backgroundImage:
                            "radial-gradient(rgba(255,255,255,0.85) 1px, transparent 1px)",
                          backgroundSize: "8px 8px",
                        }}
                      />
                      {/* 大首字 + emoji 叠加 */}
                      <span className="relative flex h-full w-full items-center justify-center">
                        <span className="font-display text-[1.95rem] font-semibold leading-none text-white drop-shadow-md">
                          {firstChar}
                        </span>
                        <span className="absolute right-1 top-1 text-[14px] drop-shadow">
                          {v.emoji}
                        </span>
                      </span>
                      {/* 排名 */}
                      <span
                        className={`absolute left-1 top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-display text-[10.5px] font-bold tabular-nums ${
                          isTopRank
                            ? "bg-primary text-primary-foreground shadow"
                            : "bg-white/85 text-foreground/80"
                        }`}
                      >
                        {rank}
                      </span>
                      {/* 平台徽章（底栏） */}
                      <span
                        className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 px-1 py-[1px] text-[9px] font-medium text-white/95"
                        style={{
                          background:
                            "linear-gradient(180deg, transparent, rgba(0,0,0,0.45))",
                        }}
                      >
                        <span aria-hidden>{sourceMeta.emoji}</span>
                        <span className="truncate">{sourceMeta.label}</span>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-[15px] num text-primary">
                          #{rank}
                        </span>
                        <h3
                          className="truncate text-[14px] font-medium text-foreground"
                          title={it.title}
                          data-testid={`hotboard-title-${idx}`}
                        >
                          {it.title}
                        </h3>
                        {it.tag && (
                          <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">
                            {it.tag}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          {sourceMeta.emoji} {sourceMeta.label}
                        </span>
                        {it.hot !== undefined && (
                          <span className="num">🔥 {formatHot(it.hot)}</span>
                        )}
                        <span className="inline-flex items-center gap-1 text-foreground/70">
                          <Sparkles className="h-3 w-3 text-primary/70" />
                          {it.dinnerHint}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <a
                          href={searchUrlFor(it)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] text-primary hover-elevate active-elevate-2"
                          data-testid={`hotboard-link-${idx}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                          看{sourceMeta.label}
                        </a>
                        {settings.source !== "baidu" && (
                          <a
                            href={baiduUrlFor(it)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] text-foreground/80 hover-elevate active-elevate-2"
                            data-testid={`hotboard-baidu-${idx}`}
                          >
                            <Search className="h-3 w-3" />
                            百度搜
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {error && (
          <p className="mt-3 text-[11px] text-muted-foreground/80" data-testid="hotboard-error">
            已使用内置热榜样例 · 联网后自动刷新；外链仍跳转到对应平台搜索结果。
          </p>
        )}
      </Card>
    </section>
  );
}
