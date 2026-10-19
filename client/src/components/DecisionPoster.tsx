// v2: 今日决定海报卡 — 让懒人决定后的结果以一种「可截图」的视觉化卡片展示。
// 不引入额外重依赖（如 html2canvas）；用户可右键/截图。提供风格切换和文案一键复制。

import { useMemo, useState } from "react";
import { Copy, Check, Image as ImgIcon, Wallet, Flame, MapPin, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FoodImage, stableSearchUrl } from "@/components/FoodImage";

export type PosterStyleId = "fresh" | "cream" | "mint" | "midnight" | "vibrant" | "minimal";

interface PosterStyle {
  id: PosterStyleId;
  label: string;
  bg: string; // CSS background
  fg: string;
  accent: string; // 强调色
  subtle: string;
}

const STYLES: PosterStyle[] = [
  { id: "fresh",    label: "清爽蓝白", bg: "linear-gradient(135deg,#e8f3ff 0%,#ffffff 60%,#dbe9fb 100%)", fg: "#0b264a", accent: "#1e7eef", subtle: "#506b95" },
  { id: "cream",    label: "奶油暖色", bg: "linear-gradient(135deg,#fbf6ec 0%,#f4e1c2 100%)", fg: "#3a2410", accent: "#c3884a", subtle: "#7a5a36" },
  { id: "mint",     label: "薄荷绿色", bg: "linear-gradient(135deg,#eef9ef 0%,#ffffff 50%,#d6f1de 100%)", fg: "#0d3a25", accent: "#2eaa6e", subtle: "#3f6f55" },
  { id: "midnight", label: "夜宵深色", bg: "linear-gradient(135deg,#0c0f17 0%,#1a2030 50%,#0c0f17 100%)", fg: "#e6ecf3", accent: "#5fa9ff", subtle: "#9ba9bd" },
  { id: "vibrant",  label: "粉橘开心", bg: "linear-gradient(135deg,#fff0eb 0%,#ffd4d4 60%,#ffeede 100%)", fg: "#581723", accent: "#ff5b67", subtle: "#88425a" },
  { id: "minimal",  label: "极简黑白", bg: "linear-gradient(135deg,#fafafa 0%,#ededed 100%)", fg: "#0e0e0e", accent: "#1a1a1a", subtle: "#666666" },
];

export interface PosterPayload {
  date: string;
  scenario?: string;
  mood?: string;
  weather?: string;
  recipe?: string;
  takeout?: string;
  snack?: string;
  fruit?: string;
  drink?: string;
  watch?: string;
  topic?: string;
  quote?: string;
  /** 估价（人民币元） */
  price?: number;
  /** 估卡路里 */
  calories?: number;
}

interface Props {
  payload: PosterPayload;
}

export function DecisionPoster({ payload }: Props) {
  const [styleId, setStyleId] = useState<PosterStyleId>("fresh");
  const style = STYLES.find((s) => s.id === styleId) ?? STYLES[0];
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => buildText(payload), [payload]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="space-y-2" data-testid="decision-poster">
      {/* 风格切换 */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]" data-testid="poster-styles">
        <span className="text-muted-foreground">海报风格</span>
        {STYLES.map((s) => {
          const active = s.id === styleId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyleId(s.id)}
              data-testid={`poster-style-${s.id}`}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80 hover-elevate"
              }`}
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: s.accent }}
              />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* 海报卡片 */}
      <Card
        className="grain relative overflow-hidden p-0"
        style={{ background: style.bg, color: style.fg, borderColor: style.accent + "33" }}
        data-testid="poster-card"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] opacity-50 blur-3xl"
          style={{
            background:
              `radial-gradient(45% 45% at 75% 25%, ${style.accent}33, transparent 60%),` +
              `radial-gradient(50% 60% at 25% 80%, ${style.accent}22, transparent 65%)`,
          }}
        />
        <div className="px-5 py-5 sm:px-7 sm:py-7">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p
                className="text-[10.5px] font-medium uppercase tracking-[0.18em]"
                style={{ color: style.accent }}
              >
                今日决定 · {payload.date}
              </p>
              <h3 className="mt-1 font-display text-[1.6rem] leading-tight tracking-tight">
                <Sparkles className="mb-1 mr-1 inline h-5 w-5" style={{ color: style.accent }} />
                替你想好这一桌
              </h3>
              {(payload.scenario || payload.mood || payload.weather) && (
                <p className="mt-1 text-[12px]" style={{ color: style.subtle }}>
                  <MapPin className="mr-1 inline h-3 w-3" />
                  {[payload.scenario, payload.mood, payload.weather].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <PosterRow label="今天做菜" value={payload.recipe} accent={style.accent} subtle={style.subtle} emoji="🍳" link={payload.recipe ? { label: "做法", href: stableSearchUrl("百度", `${payload.recipe} 家常做法`) } : undefined} />
            <PosterRow label="点外卖" value={payload.takeout} accent={style.accent} subtle={style.subtle} emoji="🛵" link={payload.takeout ? { label: "美团", href: stableSearchUrl("美团", payload.takeout) } : undefined} />
            <PosterRow label="零食" value={payload.snack} accent={style.accent} subtle={style.subtle} emoji="🍪" link={payload.snack ? { label: "美团闪购", href: stableSearchUrl("美团闪购", payload.snack) } : undefined} />
            <PosterRow label="水果" value={payload.fruit} accent={style.accent} subtle={style.subtle} emoji="🍇" link={payload.fruit ? { label: "京东到家", href: stableSearchUrl("京东", payload.fruit) } : undefined} />
            <PosterRow label="饮料" value={payload.drink} accent={style.accent} subtle={style.subtle} emoji="🥤" link={payload.drink ? { label: "搜搜", href: stableSearchUrl("百度", payload.drink) } : undefined} />
            <PosterRow label="吃饭看什么" value={payload.watch} accent={style.accent} subtle={style.subtle} emoji="🎬" link={payload.watch ? { label: "看哪", href: stableSearchUrl("百度", payload.watch + " 在线观看") } : undefined} />
            <PosterRow label="今天聊什么" value={payload.topic} accent={style.accent} subtle={style.subtle} emoji="💬" />
          </div>

          {(payload.price !== undefined || payload.calories !== undefined) && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px]">
              {payload.price !== undefined && (
                <span className="num inline-flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" style={{ color: style.accent }} />
                  估价 ¥{Math.round(payload.price)}
                </span>
              )}
              {payload.calories !== undefined && (
                <span className="num inline-flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5" style={{ color: style.accent }} />
                  约 {Math.round(payload.calories)} kcal
                </span>
              )}
            </div>
          )}

          {payload.quote && (
            <p
              className="mt-4 inline-flex max-w-full items-center gap-1 rounded-full px-3 py-1 text-[12.5px]"
              style={{ background: style.accent + "1a", color: style.accent }}
              data-testid="poster-quote"
            >
              💛 {payload.quote}
            </p>
          )}

          <p className="mt-4 text-[10px]" style={{ color: style.subtle }}>
            截图保存即可分享 · 内置生成 · 不联网
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="h-8 rounded-full text-[12px]"
          data-testid="poster-copy"
        >
          {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
          {copied ? "已复制文案" : "复制海报文案"}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          <ImgIcon className="mr-1 inline h-3 w-3" />
          想保存图片？右键 / 长按 / 系统截图皆可
        </span>
      </div>
    </section>
  );
}

function PosterRow({
  label,
  value,
  accent,
  subtle,
  emoji,
  link,
}: {
  label: string;
  value?: string;
  accent: string;
  subtle: string;
  emoji?: string;
  link?: { label: string; href: string };
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border bg-white/40 px-3 py-2 text-[13px] backdrop-blur-sm" style={{ borderColor: accent + "33" }}>
      <FoodImage
        query={value}
        name={value}
        emoji={emoji}
        gradient={[accent + "ff", accent + "88"]}
        className="h-12 w-12 flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] uppercase tracking-wider" style={{ color: subtle }}>
          {label}
        </p>
        <p className="mt-0.5 truncate font-medium leading-snug">{value}</p>
        {link && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-0.5 text-[10.5px] underline-offset-2 hover:underline"
            style={{ color: accent }}
          >
            <ExternalLink className="h-2.5 w-2.5" />
            {link.label}
          </a>
        )}
      </div>
    </div>
  );
}

function buildText(p: PosterPayload): string {
  const lines = [
    `今日决定 · ${p.date}`,
    p.scenario || p.mood || p.weather
      ? `场景：${[p.scenario, p.mood, p.weather].filter(Boolean).join(" · ")}`
      : "",
    p.recipe ? `· 做菜：${p.recipe}` : "",
    p.takeout ? `· 外卖：${p.takeout}` : "",
    p.snack ? `· 零食：${p.snack}` : "",
    p.fruit ? `· 水果：${p.fruit}` : "",
    p.drink ? `· 饮料：${p.drink}` : "",
    p.watch ? `· 看：${p.watch}` : "",
    p.topic ? `· 聊：${p.topic}` : "",
    p.price !== undefined ? `预算估算 ¥${Math.round(p.price)}` : "",
    p.calories !== undefined ? `热量估算 ≈ ${Math.round(p.calories)} kcal` : "",
    p.quote ? p.quote : "",
  ];
  return lines.filter(Boolean).join("\n");
}
