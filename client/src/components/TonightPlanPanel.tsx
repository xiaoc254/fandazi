// 「今晚最终方案」聚合页（#/tonight-plan）— 海报式呈现
// 用户在 #/solo 或 #/family-tonight 点击「就按这个」之后，结果会沉淀成一份
// 结构化的最终方案；本页把它做成「适合截图分享」的海报样式：
//  - 3 套色系（清爽蓝绿 / 暖橙治愈 / 夜间紫），可在右上角切换；
//  - 强化标题、日期、人群、预算 / 热量、鼓励语层级；
//  - 卡片化分区，手机端不再过长；保留复制 / 再生成 / 继续完善入口。

import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  ChefHat,
  RefreshCw,
  ClipboardCopy,
  CheckCircle2,
  Wallet,
  Flame,
  Heart,
  ChevronRight,
  Users,
  Refrigerator,
  Repeat,
  CalendarDays,
  HeartPulse,
  Snowflake,
  ShoppingCart,
  ScrollText,
  ShieldCheck,
  AlertTriangle,
  Coffee,
  Palette,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import {
  useTonightPlan,
  formatTonightPlanText,
  clearTonightPlan,
  type TonightPlan,
} from "@/lib/tonightPlan";
import { addShoppingItems } from "@/lib/shoppingList";

// ---- 海报色系 ----
type PosterTheme = "mint" | "warm" | "night";

interface PosterPalette {
  id: PosterTheme;
  label: string;
  /** 海报最外层背景渐变（heroBg 完整背景）*/
  heroGradient: string;
  /** 海报描边颜色（border）*/
  heroBorder: string;
  /** 装饰光斑渐变 */
  glowGradient: string;
  /** Hero 上的小标 / 日期色 */
  accentText: string;
  /** Hero 上主标题色 */
  titleText: string;
  /** Hero 上副文本 / 引语色 */
  bodyText: string;
  /** 主卡背景 */
  cardBg: string;
  /** 主卡描边 */
  cardBorder: string;
  /** 主卡分区行背景 */
  rowBg: string;
  /** 主卡分区行描边 */
  rowBorder: string;
  /** 主卡分区主文字 */
  rowText: string;
  /** 主卡分区副文字 */
  rowSubText: string;
  /** 分区图标圈背景 */
  iconBg: string;
  /** 分区图标颜色 */
  iconText: string;
  /** Tag chip 配色 */
  chipBg: string;
  chipText: string;
  /** 预算 / 热量条配色 */
  totalsBg: string;
  totalsText: string;
  totalsIcon: string;
  /** 主操作按钮（复制方案）*/
  ctaBg: string;
  ctaText: string;
  ctaHover: string;
  /** 次要按钮（再生成）*/
  secondaryBorder: string;
  secondaryText: string;
  secondaryHover: string;
  /** 继续完善入口 */
  linkBg: string;
  linkBorder: string;
  linkText: string;
  linkHint: string;
  /** 适合的图标 */
  themeIcon: React.ReactNode;
}

const PALETTES: Record<PosterTheme, PosterPalette> = {
  mint: {
    id: "mint",
    label: "清爽蓝绿",
    heroGradient: "from-sky-50 via-emerald-50 to-teal-50",
    heroBorder: "border-emerald-200/70",
    glowGradient: "from-sky-200/70 via-emerald-200/40 to-transparent",
    accentText: "text-emerald-700/85",
    titleText: "text-emerald-950",
    bodyText: "text-emerald-900/75",
    cardBg: "bg-white/85",
    cardBorder: "border-emerald-200/60",
    rowBg: "bg-emerald-50/70",
    rowBorder: "border-emerald-200/60",
    rowText: "text-emerald-950",
    rowSubText: "text-emerald-800/70",
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-700",
    chipBg: "bg-white/80",
    chipText: "text-emerald-800",
    totalsBg: "bg-emerald-50/80 border-emerald-200/60",
    totalsText: "text-emerald-950",
    totalsIcon: "text-emerald-700",
    ctaBg: "bg-emerald-600",
    ctaText: "text-white",
    ctaHover: "hover:bg-emerald-700",
    secondaryBorder: "border-emerald-300",
    secondaryText: "text-emerald-800",
    secondaryHover: "hover:bg-emerald-50",
    linkBg: "bg-white/80",
    linkBorder: "border-emerald-200/60",
    linkText: "text-emerald-950",
    linkHint: "text-emerald-700/70",
    themeIcon: <Snowflake className="h-3.5 w-3.5" />,
  },
  warm: {
    id: "warm",
    label: "暖橙治愈",
    heroGradient: "from-rose-50 via-orange-50 to-amber-50",
    heroBorder: "border-orange-200/70",
    glowGradient: "from-rose-200/70 via-amber-200/40 to-transparent",
    accentText: "text-rose-700/85",
    titleText: "text-rose-950",
    bodyText: "text-rose-900/75",
    cardBg: "bg-white/85",
    cardBorder: "border-orange-200/60",
    rowBg: "bg-orange-50/70",
    rowBorder: "border-orange-200/60",
    rowText: "text-rose-950",
    rowSubText: "text-rose-800/70",
    iconBg: "bg-rose-500/15",
    iconText: "text-rose-600",
    chipBg: "bg-white/80",
    chipText: "text-rose-800",
    totalsBg: "bg-orange-50/80 border-orange-200/60",
    totalsText: "text-rose-950",
    totalsIcon: "text-rose-600",
    ctaBg: "bg-rose-600",
    ctaText: "text-white",
    ctaHover: "hover:bg-rose-700",
    secondaryBorder: "border-rose-300",
    secondaryText: "text-rose-800",
    secondaryHover: "hover:bg-rose-50",
    linkBg: "bg-white/80",
    linkBorder: "border-orange-200/60",
    linkText: "text-rose-950",
    linkHint: "text-rose-700/70",
    themeIcon: <Sun className="h-3.5 w-3.5" />,
  },
  night: {
    id: "night",
    label: "夜间紫",
    heroGradient: "from-slate-900 via-indigo-900 to-purple-900",
    heroBorder: "border-indigo-400/40",
    glowGradient: "from-fuchsia-400/40 via-indigo-400/20 to-transparent",
    accentText: "text-indigo-200",
    titleText: "text-white",
    bodyText: "text-indigo-100/80",
    cardBg: "bg-slate-900/85",
    cardBorder: "border-indigo-400/30",
    rowBg: "bg-slate-800/70",
    rowBorder: "border-indigo-400/20",
    rowText: "text-white",
    rowSubText: "text-indigo-200/75",
    iconBg: "bg-fuchsia-400/20",
    iconText: "text-fuchsia-200",
    chipBg: "bg-white/10",
    chipText: "text-indigo-100",
    totalsBg: "bg-slate-800/80 border-indigo-400/20",
    totalsText: "text-white",
    totalsIcon: "text-fuchsia-200",
    ctaBg: "bg-fuchsia-500",
    ctaText: "text-white",
    ctaHover: "hover:bg-fuchsia-600",
    secondaryBorder: "border-indigo-400/40",
    secondaryText: "text-indigo-100",
    secondaryHover: "hover:bg-white/10",
    linkBg: "bg-slate-800/70",
    linkBorder: "border-indigo-400/20",
    linkText: "text-white",
    linkHint: "text-indigo-200/70",
    themeIcon: <Moon className="h-3.5 w-3.5" />,
  },
};

const THEME_KEY = "chishenme.tonightPlan.theme.v1";

function loadStoredTheme(kind: TonightPlan["kind"]): PosterTheme {
  if (typeof window === "undefined") return defaultTheme(kind);
  try {
    const v = window.localStorage.getItem(THEME_KEY) as PosterTheme | null;
    if (v && (v === "mint" || v === "warm" || v === "night")) return v;
  } catch {
    // ignore
  }
  return defaultTheme(kind);
}

function defaultTheme(kind: TonightPlan["kind"]): PosterTheme {
  // 单人偏暖橙治愈，家庭偏清爽蓝绿；夜间紫由用户主动选。
  return kind === "solo" ? "warm" : "mint";
}

function persistTheme(t: PosterTheme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_KEY, t);
  } catch {
    // ignore
  }
}

interface DeepLinkDef {
  testId: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  hash: string;
}

const SOLO_DEEP_LINKS: DeepLinkDef[] = [
  {
    testId: "tonight-link-solo",
    icon: <RefreshCw className="h-4 w-4" />,
    label: "再换一份",
    hint: "回到一键安排",
    hash: "#/solo",
  },
  {
    testId: "tonight-link-health",
    icon: <HeartPulse className="h-4 w-4" />,
    label: "看看健康",
    hint: "热量·油盐",
    hash: "#/health",
  },
  {
    testId: "tonight-link-snacks",
    icon: <ShoppingCart className="h-4 w-4" />,
    label: "再买点零食",
    hint: "便利店清单",
    hash: "#/snacks",
  },
  {
    testId: "tonight-link-shopping",
    icon: <ShoppingCart className="h-4 w-4" />,
    label: "购物清单",
    hint: "缺料汇总",
    hash: "#/shopping",
  },
  {
    testId: "tonight-link-companion",
    icon: <ScrollText className="h-4 w-4" />,
    label: "聊点啥",
    hint: "饭桌话题",
    hash: "#/companion",
  },
];

const FAMILY_DEEP_LINKS: DeepLinkDef[] = [
  {
    testId: "tonight-link-family-tonight",
    icon: <RefreshCw className="h-4 w-4" />,
    label: "再来一组",
    hint: "回到一家人",
    hash: "#/family-tonight",
  },
  {
    testId: "tonight-link-fridge",
    icon: <Refrigerator className="h-4 w-4" />,
    label: "冰箱有啥",
    hint: "补充库存",
    hash: "#/fridge",
  },
  {
    testId: "tonight-link-leftover",
    icon: <Repeat className="h-4 w-4" />,
    label: "剩菜变花样",
    hint: "明天用上",
    hash: "#/leftover",
  },
  {
    testId: "tonight-link-weekly",
    icon: <CalendarDays className="h-4 w-4" />,
    label: "一周菜单",
    hint: "规划全周",
    hash: "#/weekly",
  },
  {
    testId: "tonight-link-family-shopping",
    icon: <ShoppingCart className="h-4 w-4" />,
    label: "购物清单",
    hint: "缺料汇总",
    hash: "#/shopping",
  },
];

// 「今晚 · YYYY-MM-DD · 周X」诗意小副标
const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

export function TonightPlanPanel() {
  const plan = useTonightPlan();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const [theme, setTheme] = useState<PosterTheme>(() =>
    loadStoredTheme(plan?.kind ?? "solo"),
  );

  useEffect(() => {
    setCopied(false);
    setFallback(null);
  }, [plan?.createdAt]);

  function changeTheme(t: PosterTheme) {
    setTheme(t);
    persistTheme(t);
  }

  if (!plan) {
    return <EmptyState />;
  }

  return (
    <PlanView
      plan={plan}
      theme={theme}
      onTheme={changeTheme}
      copied={copied}
      fallback={fallback}
      onCopy={async () => {
        const text = formatTonightPlanText(plan);
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setFallback(null);
            toast({
              title: "已复制方案 ✓",
              description: "可以直接粘贴到聊天 / 备忘录。",
            });
            return;
          }
          throw new Error("no-clipboard");
        } catch {
          // 兜底：展示一段可手动选中复制的文本
          setFallback(text);
          setCopied(false);
          toast({
            title: "无法自动复制",
            description: "下方已展示方案文本，请长按全选手动复制。",
          });
        }
      }}
      onRegenerate={() => {
        const target = plan.kind === "solo" ? "#/solo" : "#/family-tonight";
        if (typeof window !== "undefined") window.location.hash = target;
      }}
      onClearFallback={() => setFallback(null)}
      onClear={() => {
        clearTonightPlan();
        toast({ title: "已清空今晚最终方案" });
      }}
    />
  );
}

function EmptyState() {
  function go(hash: string) {
    if (typeof window !== "undefined") window.location.hash = hash;
  }
  return (
    <section className="mt-2 space-y-4" data-testid="tonight-plan-empty">
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-rose-50 via-orange-50 to-emerald-50 px-5 py-6 sm:px-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-rose-200/60 to-emerald-200/40 blur-2xl"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary/85">
            <Sparkles className="h-3 w-3" />
            今晚最终方案
          </p>
          <h2 className="mt-2 font-display text-[1.6rem] leading-tight tracking-tight text-foreground sm:text-[1.9rem]">
            还没有今晚的最终方案
          </h2>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-foreground/75 sm:text-[14.5px]">
            到「单人一键」或「一家人今晚」生成一份方案后，点「就按这个」就会沉淀到这里 ——
            一张可复制 / 可分享 / 可继续完善的最终答案卡片。
          </p>
        </div>
      </div>
      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            size="lg"
            className="h-12 gap-2 rounded-full"
            onClick={() => go("#/solo")}
            data-testid="tonight-empty-solo"
          >
            <Sparkles className="h-4 w-4" />
            单人一键安排今晚
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-12 gap-2 rounded-full"
            onClick={() => go("#/family-tonight")}
            data-testid="tonight-empty-family"
          >
            <Users className="h-4 w-4" />
            一家人今晚吃什么
          </Button>
        </div>
      </Card>
    </section>
  );
}

function PlanView({
  plan,
  theme,
  onTheme,
  copied,
  fallback,
  onCopy,
  onRegenerate,
  onClearFallback,
  onClear,
}: {
  plan: TonightPlan;
  theme: PosterTheme;
  onTheme: (t: PosterTheme) => void;
  copied: boolean;
  fallback: string | null;
  onCopy: () => void;
  onRegenerate: () => void;
  onClearFallback: () => void;
  onClear: () => void;
}) {
  const { toast } = useToast();
  const palette = PALETTES[theme];
  const date = useMemo(() => {
    try {
      const d = new Date(plan.createdAt);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${m}-${day} · 周${DAY_NAMES[d.getDay()] ?? ""}`;
    } catch {
      return "";
    }
  }, [plan.createdAt]);

  const deepLinks = plan.kind === "solo" ? SOLO_DEEP_LINKS : FAMILY_DEEP_LINKS;
  const compatMeta = compatBadgeMeta(plan.familyCompat);

  return (
    <section
      className="mt-2 space-y-4"
      data-testid="tonight-plan-panel"
      data-theme={theme}
    >
      {/* 顶部主题切换条 */}
      <div
        className="flex items-center justify-between rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-[11.5px] sm:px-4"
        data-testid="tonight-plan-theme-bar"
      >
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Palette className="h-3.5 w-3.5" />
          海报色系
        </span>
        <div className="flex items-center gap-1">
          {(Object.keys(PALETTES) as PosterTheme[]).map((id) => {
            const p = PALETTES[id];
            const active = id === theme;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTheme(id)}
                aria-pressed={active}
                data-testid={`tonight-plan-theme-${id}`}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/70 hover-elevate active-elevate-2"
                }`}
              >
                {p.themeIcon}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 海报：Hero + 主卡（两段同色系） */}
      <article
        className={`overflow-hidden rounded-3xl border ${palette.heroBorder} shadow-md`}
        data-testid="tonight-plan-poster"
      >
        {/* Hero 区 */}
        <div
          className={`relative overflow-hidden bg-gradient-to-br px-5 py-6 sm:px-7 sm:py-7 ${palette.heroGradient}`}
          data-testid="tonight-plan-hero"
        >
          <div
            aria-hidden
            className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${palette.glowGradient} blur-3xl`}
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-gradient-to-tr ${palette.glowGradient} blur-3xl opacity-70`}
          />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.22em] ${palette.accentText}`}
              >
                <Sparkles className="h-3 w-3" />
                今晚最终方案
              </p>
              <p
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] ${palette.accentText} ${palette.heroBorder}`}
                data-testid="tonight-plan-kind"
              >
                {plan.kind === "solo" ? (
                  <>
                    <User className="h-3 w-3" /> 单人
                  </>
                ) : (
                  <>
                    <Users className="h-3 w-3" /> 一家人
                  </>
                )}
              </p>
            </div>
            <h2
              className={`mt-2 font-display text-[1.85rem] leading-tight tracking-tight sm:text-[2.1rem] ${palette.titleText}`}
              data-testid="tonight-plan-title"
            >
              {plan.title}
            </h2>
            <p
              className={`mt-1 num text-[12.5px] ${palette.bodyText}`}
              data-testid="tonight-plan-audience"
            >
              {plan.audience}
              {date && <span className="ml-2 opacity-80">{date}</span>}
            </p>
            {plan.tags.length > 0 && (
              <div
                className="mt-3 flex flex-wrap gap-1"
                data-testid="tonight-plan-tags"
              >
                {plan.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className={`rounded-full px-2 py-0 text-[10.5px] ${palette.chipBg} ${palette.chipText} ${palette.heroBorder}`}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            )}
            {plan.quote && (
              <p
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] ${palette.chipBg} ${palette.chipText}`}
                data-testid="tonight-plan-quote"
              >
                <Heart className={`h-3 w-3 ${palette.iconText}`} />
                {plan.quote}
              </p>
            )}
            {/* 预算 / 热量 摘要：嵌入 hero，更适合截图 */}
            {(typeof plan.budget === "number" ||
              typeof plan.calories === "number") && (
              <div
                className={`mt-4 inline-flex flex-wrap items-center gap-3 rounded-2xl border px-3 py-2 text-[12.5px] ${palette.totalsBg} ${palette.totalsText}`}
                data-testid="tonight-plan-totals"
              >
                {typeof plan.budget === "number" && (
                  <span className="num inline-flex items-center gap-1">
                    <Wallet className={`h-3.5 w-3.5 ${palette.totalsIcon}`} />
                    预算估算 ¥{plan.budget}
                  </span>
                )}
                {typeof plan.calories === "number" && (
                  <span className="num inline-flex items-center gap-1">
                    <Flame className={`h-3.5 w-3.5 ${palette.totalsIcon}`} />
                    热量估算 ≈ {plan.calories} kcal
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 主卡：分区 */}
        <div
          className={`border-t px-4 py-5 sm:px-6 sm:py-6 ${palette.cardBorder} ${palette.cardBg}`}
          data-testid="tonight-plan-card"
        >
          <div className="space-y-2.5">
            {plan.lines.map((ln, i) => (
              <PlanLineRow
                key={`${ln.label}-${i}`}
                line={ln}
                index={i}
                palette={palette}
              />
            ))}
          </div>

          {/* 家庭兼容 / 冰箱 / 剩菜 / 明天 */}
          {(plan.familyCompat ||
            (plan.familyCompatLines && plan.familyCompatLines.length > 0) ||
            (plan.fridgeMatched && plan.fridgeMatched.length > 0) ||
            (plan.fridgeMissing && plan.fridgeMissing.length > 0) ||
            plan.remixHint ||
            plan.tomorrowHint) && (
            <div className="mt-4 space-y-2" data-testid="tonight-plan-extras">
              {compatMeta && (
                <InfoRow
                  testId="tonight-plan-compat"
                  icon={compatMeta.icon}
                  title={`家庭兼容 · ${compatMeta.text}`}
                  tone={compatMeta.tone}
                  palette={palette}
                >
                  {plan.familyCompatLines && plan.familyCompatLines.length > 0 ? (
                    <ul className={`space-y-0.5 text-[11.5px] ${palette.rowSubText}`}>
                      {plan.familyCompatLines.map((l) => (
                        <li key={l}>• {l}</li>
                      ))}
                    </ul>
                  ) : null}
                </InfoRow>
              )}
              {(plan.fridgeMatched?.length || plan.fridgeMissing?.length) && (
                <InfoRow
                  testId="tonight-plan-fridge"
                  icon={<Snowflake className="h-4 w-4" />}
                  title="冰箱情况"
                  tone="default"
                  palette={palette}
                >
                  {plan.fridgeMatched && plan.fridgeMatched.length > 0 && (
                    <p className="text-[11.5px] text-emerald-700">
                      ✓ 现有：{plan.fridgeMatched.join(" · ")}
                    </p>
                  )}
                  {plan.fridgeMissing && plan.fridgeMissing.length > 0 && (
                    <>
                      <p className="text-[11.5px] text-amber-700">
                        还需买：{plan.fridgeMissing.join(" · ")}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const r = addShoppingItems(
                              (plan.fridgeMissing ?? []).map((m) => ({
                                name: m,
                                source: "tonight-plan",
                                note: plan.title,
                              })),
                            );
                            const desc =
                              r.added > 0 && r.merged > 0
                                ? `新增 ${r.added} 项 · 合并 ${r.merged} 项`
                                : r.merged > 0
                                  ? `合并 ${r.merged} 项到已有清单`
                                  : `已加入 ${r.added} 项`;
                            toast({ title: "已加入购物清单 ✓", description: desc });
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover-elevate active-elevate-2"
                          data-testid="tonight-plan-add-shopping"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          加入购物清单
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== "undefined")
                              window.location.hash = "#/shopping";
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover-elevate active-elevate-2"
                          data-testid="tonight-plan-view-shopping"
                        >
                          查看购物清单
                        </button>
                      </div>
                    </>
                  )}
                </InfoRow>
              )}
              {plan.remixHint && (
                <InfoRow
                  testId="tonight-plan-remix"
                  icon={<Repeat className="h-4 w-4" />}
                  title="剩菜改造"
                  tone="default"
                  palette={palette}
                >
                  <p className={`text-[11.5px] ${palette.rowSubText}`}>
                    {plan.remixHint}
                  </p>
                </InfoRow>
              )}
              {plan.tomorrowHint && (
                <InfoRow
                  testId="tonight-plan-tomorrow"
                  icon={<CalendarDays className="h-4 w-4" />}
                  title="明天衔接"
                  tone="default"
                  palette={palette}
                >
                  <p className={`text-[11.5px] ${palette.rowSubText}`}>
                    {plan.tomorrowHint}
                  </p>
                </InfoRow>
              )}
            </div>
          )}

          {/* 海报底部小落款，截图分享时友好 */}
          <div
            className={`mt-5 flex items-center justify-between border-t pt-3 text-[10.5px] ${palette.cardBorder} ${palette.rowSubText}`}
            data-testid="tonight-plan-footer"
          >
            <span className="inline-flex items-center gap-1">
              <ChefHat className={`h-3 w-3 ${palette.iconText}`} />
              来自「今天吃什么 · 饭搭子」
            </span>
            <span className="opacity-80">截图分享给同桌人 ✨</span>
          </div>
        </div>
      </article>

      {/* 海报外的操作区：复制 / 再生成 */}
      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="h-12 flex-1 gap-2 rounded-full"
            onClick={onCopy}
            data-testid="tonight-plan-copy"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                已复制 ✓
              </>
            ) : (
              <>
                <ClipboardCopy className="h-4 w-4" />
                复制方案
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 gap-2 rounded-full"
            onClick={onRegenerate}
            data-testid="tonight-plan-regenerate"
          >
            <RefreshCw className="h-4 w-4" />
            再生成
          </Button>
        </div>

        {fallback && (
          <div
            className="mt-3 rounded-xl border border-amber-300/70 bg-amber-50/60 p-3 text-[12px]"
            data-testid="tonight-plan-copy-fallback"
          >
            <p className="mb-1 inline-flex items-center gap-1 text-amber-800">
              <ClipboardCopy className="h-3.5 w-3.5" />
              浏览器拒绝了自动复制 — 请长按下面的文本全选手动复制：
            </p>
            <textarea
              readOnly
              value={fallback}
              className="h-44 w-full resize-none rounded-md border border-amber-300/60 bg-white/80 p-2 font-mono text-[11.5px] leading-relaxed text-foreground"
              data-testid="tonight-plan-copy-fallback-text"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={onClearFallback}
              className="mt-1 text-[11px] text-amber-700 underline-offset-2 hover:underline"
              data-testid="tonight-plan-copy-fallback-close"
            >
              收起
            </button>
          </div>
        )}

        {/* 继续完善 */}
        <div
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
          data-testid="tonight-plan-deep-links"
        >
          {deepLinks.map((d) => (
            <button
              key={d.testId}
              type="button"
              data-testid={d.testId}
              onClick={() => {
                if (typeof window !== "undefined") window.location.hash = d.hash;
              }}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 text-left transition-colors hover-elevate active-elevate-2 hover:border-primary/40"
            >
              <span className="text-primary">{d.icon}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[12.5px] font-medium text-foreground">
                  {d.label}
                </span>
                <span className="text-[10.5px] text-muted-foreground">{d.hint}</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
          data-testid="tonight-plan-clear"
        >
          清空这份方案
        </button>
      </Card>
    </section>
  );
}

function PlanLineRow({
  line,
  index,
  palette,
}: {
  line: TonightPlan["lines"][number];
  index: number;
  palette: PosterPalette;
}) {
  const Icon = iconForLabel(line.label);
  return (
    <div
      className={`flex items-start gap-2.5 rounded-2xl border px-3 py-2.5 ${palette.rowBorder} ${palette.rowBg}`}
      data-testid={`tonight-plan-line-${index}`}
    >
      <span
        className={`mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${palette.iconBg} ${palette.iconText}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[10.5px] font-medium uppercase tracking-wider ${palette.rowSubText}`}
        >
          {line.label}
        </p>
        <p className={`text-[14px] font-medium ${palette.rowText}`}>{line.text}</p>
        {line.detail && (
          <p className={`mt-0.5 text-[11.5px] ${palette.rowSubText}`}>
            {line.detail}
          </p>
        )}
        {line.link && (
          <a
            href={line.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 inline-block text-[11px] underline-offset-2 hover:underline ${palette.iconText}`}
          >
            → {line.link.label}
          </a>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  testId,
  icon,
  title,
  tone,
  palette,
  children,
}: {
  testId: string;
  icon: React.ReactNode;
  title: string;
  tone: "default" | "amber" | "rose" | "emerald";
  palette: PosterPalette;
  children?: React.ReactNode;
}) {
  // 警示色保持 tone 自身的语义色（红黄绿），其它情况跟随 palette。
  const toneCls =
    tone === "amber"
      ? "border-amber-300/70 bg-amber-50/60 text-amber-900"
      : tone === "rose"
        ? "border-rose-300/70 bg-rose-50/60 text-rose-900"
        : tone === "emerald"
          ? "border-emerald-300/70 bg-emerald-50/60 text-emerald-900"
          : `${palette.rowBorder} ${palette.rowBg} ${palette.rowText}`;
  return (
    <div
      className={`flex items-start gap-2 rounded-2xl border px-3 py-2.5 text-[12.5px] ${toneCls}`}
      data-testid={testId}
    >
      <span className={`mt-0.5 flex-shrink-0 ${palette.iconText}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {children}
      </div>
    </div>
  );
}

function compatBadgeMeta(level?: TonightPlan["familyCompat"]):
  | {
      icon: React.ReactNode;
      text: string;
      tone: "default" | "amber" | "rose" | "emerald";
    }
  | null {
  if (!level) return null;
  if (level === "red") {
    return {
      icon: <AlertTriangle className="h-4 w-4" />,
      text: "注意冲突",
      tone: "rose",
    };
  }
  if (level === "amber") {
    return {
      icon: <ShieldCheck className="h-4 w-4" />,
      text: "部分兼容",
      tone: "amber",
    };
  }
  return {
    icon: <ShieldCheck className="h-4 w-4" />,
    text: "全家兼容",
    tone: "emerald",
  };
}

function iconForLabel(label: string) {
  if (label.includes("外卖")) return Sparkles;
  if (
    label.includes("主菜") ||
    label.includes("主餐") ||
    label.includes("做饭") ||
    label.includes("做")
  )
    return ChefHat;
  if (
    label.includes("配菜") ||
    label.includes("素") ||
    label.includes("蔬")
  )
    return ScrollText;
  if (label.includes("汤") || label.includes("主食")) return ChefHat;
  if (label.includes("零食")) return ShoppingCart;
  if (label.includes("水果")) return ShoppingCart;
  if (label.includes("喝") || label.includes("饮料") || label.includes("饮"))
    return Coffee;
  if (label.includes("看")) return ScrollText;
  if (label.includes("听")) return ScrollText;
  return Sparkles;
}
