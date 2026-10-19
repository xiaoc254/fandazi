// 「饭桌陪伴」模块:吃饭看什么 / 今天聊什么 / 做饭听什么。
// 三个 Tab,内置数据,推荐结果可"换一批",外链全部新窗口 + noopener noreferrer。

import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
  Tv,
  MessageCircle,
  Headphones,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildSearchLinks } from "@/data/companions";
import {
  recommendWatch,
  recommendTopics,
  recommendAudio,
  deriveCompanionAudiences,
  type CompanionContext,
  type RecommendedWatch,
  type RecommendedTopic,
  type RecommendedAudio,
} from "@/lib/companionRecommend";

type TabKey = "watch" | "topic" | "audio";

const COMPANION_GRADIENTS: [string, string][] = [
  ["#fbb273", "#c8552a"],
  ["#f0c179", "#a85a2c"],
  ["#a4cef0", "#3a78b6"],
  ["#bce39a", "#5e9c45"],
  ["#f8bbd0", "#c2185b"],
  ["#c5cae9", "#3f51b5"],
  ["#b2dfdb", "#00897b"],
  ["#ffd180", "#f57c00"],
];

function pickCompanionGradient(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return COMPANION_GRADIENTS[Math.abs(h) % COMPANION_GRADIENTS.length];
}

function pickCompanionEmoji(title: string, kind: "watch" | "audio", typeHint?: string): string {
  const t = `${title}|${typeHint ?? ""}`;
  if (/纪录|纪实|风味|地球|自然/.test(t)) return "🌏";
  if (/动画|动漫|宫崎|漫|番/.test(t)) return "🎞️";
  if (/综艺|笑|搞笑|喜剧|相声|脱口/.test(t)) return "🎙️";
  if (/悬疑|推理|侦探|凶/.test(t)) return "🔍";
  if (/美食|厨|食|做饭|餐|烤|甜/.test(t)) return "🍱";
  if (/球|赛|奥运|联赛/.test(t)) return "🏆";
  if (/历史|帝|朝/.test(t)) return "🏯";
  if (/科幻|宇宙|太空|未来/.test(t)) return "🛸";
  if (/电影|院线|首映|大片/.test(t)) return "🎬";
  if (/电视剧|剧/.test(t)) return "📺";
  if (/小说|书|文学|读书/.test(t)) return "📖";
  if (/古典|交响|钢琴|爵士|乐曲/.test(t)) return "🎼";
  if (/民谣|流行|金曲|华语/.test(t)) return "🎵";
  if (/播客|脱口|访谈|对谈/.test(t)) return "🎤";
  if (/治愈|温暖|睡前|白噪|放松/.test(t)) return "🌿";
  return kind === "watch" ? "🎬" : "🎧";
}

function CompanionVisual({
  title,
  kind,
  typeHint,
}: {
  title: string;
  kind: "watch" | "audio";
  typeHint?: string;
}) {
  const gradient = pickCompanionGradient(title + kind);
  const emoji = pickCompanionEmoji(title, kind, typeHint);
  const firstChar = (title || "").trim().charAt(0) || emoji;
  return (
    <div
      className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl shadow-sm sm:h-14 sm:w-14"
      style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
      aria-hidden
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.4), transparent 60%)",
        }}
      />
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.85) 1px, transparent 1px)",
          backgroundSize: "8px 8px",
        }}
      />
      <span className="relative flex h-full w-full items-center justify-center font-display text-[1.3rem] font-semibold text-white drop-shadow-md sm:text-[1.55rem]">
        {firstChar}
      </span>
      <span className="absolute right-0.5 top-0.5 text-[12px] drop-shadow">{emoji}</span>
      {typeHint && (
        <span
          className="absolute inset-x-0 bottom-0 truncate px-1 py-[1px] text-center text-[8.5px] font-medium text-white/95"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(0,0,0,0.42))",
          }}
        >
          {typeHint}
        </span>
      )}
    </div>
  );
}

interface Props {
  ctx: CompanionContext;
}

type SceneChip = NonNullable<CompanionContext["sceneOverride"]>;
type MoodChip = NonNullable<CompanionContext["moodOverride"]>;
type SlotChip = NonNullable<CompanionContext["slotOverride"]>;

const SCENE_CHIPS: { id: SceneChip; label: string; emoji: string }[] = [
  { id: "single", label: "单人", emoji: "🧍" },
  { id: "couple", label: "双人", emoji: "👫" },
  { id: "family", label: "家庭", emoji: "👨‍👩‍👧" },
  { id: "friends", label: "朋友", emoji: "🍻" },
  { id: "elder", label: "长辈", emoji: "👴" },
];

const MOOD_CHIPS: { id: MoodChip; label: string; emoji: string }[] = [
  { id: "relax", label: "放松", emoji: "🌿" },
  { id: "laugh", label: "想笑", emoji: "😄" },
  { id: "down", label: "低落", emoji: "🌧️" },
  { id: "learn", label: "想学习", emoji: "📚" },
  { id: "lively", label: "热闹", emoji: "🎉" },
];

const SLOT_CHIPS: { id: SlotChip; label: string; emoji: string }[] = [
  { id: "breakfast", label: "早餐", emoji: "🌅" },
  { id: "lunch", label: "午餐", emoji: "🌞" },
  { id: "dinner", label: "晚餐", emoji: "🌙" },
  { id: "midnight", label: "夜宵", emoji: "🌃" },
];

export function CompanionPanel({ ctx }: Props) {
  const [tab, setTab] = useState<TabKey>("watch");
  const [nonce, setNonce] = useState(0);
  const [scene, setScene] = useState<SceneChip | null>(null);
  const [mood, setMood] = useState<MoodChip | null>(null);
  const [slot, setSlot] = useState<SlotChip | null>(null);

  const effectiveCtx: CompanionContext = useMemo(
    () => ({
      ...ctx,
      sceneOverride: scene ?? undefined,
      moodOverride: mood ?? undefined,
      slotOverride: slot ?? undefined,
    }),
    [ctx, scene, mood, slot],
  );

  // ctx 中关键字段变化时,自动重抽,避免参数变了但卡片没刷新
  const ctxKey = `${effectiveCtx.scenarioId}|${effectiveCtx.servings}|${effectiveCtx.slot}|${effectiveCtx.maxTimeMinutes ?? ""}|${effectiveCtx.age ?? ""}|${effectiveCtx.hasKids ? 1 : 0}|${effectiveCtx.elderHeavy ? 1 : 0}|${scene ?? ""}|${mood ?? ""}|${slot ?? ""}`;

  const watch = useMemo<RecommendedWatch[]>(
    () => recommendWatch(effectiveCtx, 4),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctxKey, nonce, tab === "watch"],
  );
  const topics = useMemo<RecommendedTopic[]>(
    () => recommendTopics(effectiveCtx, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctxKey, nonce, tab === "topic"],
  );
  const audio = useMemo<RecommendedAudio[]>(
    () => recommendAudio(effectiveCtx, 4),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctxKey, nonce, tab === "audio"],
  );

  // 当 tab 切换时,如果该 tab 还没生成过推荐,主动 nonce++
  useEffect(() => {
    setNonce((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const audiences = deriveCompanionAudiences(effectiveCtx);
  const audienceLabel = audiences.slice(0, 3).join(" / ");

  return (
    <section className="mt-10" data-testid="companion-panel">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-[1.05rem] tracking-tight">饭桌陪伴</h2>
        <span className="text-[11px] text-muted-foreground">
          <Users className="mr-1 inline h-3 w-3" />
          按当前场景 · {audienceLabel}
        </span>
      </div>

      <Card className="grain border-card-border/60 bg-card/70 p-3 sm:p-4">
        {/* Tab 切换 */}
        <div className="flex flex-wrap gap-1.5" role="tablist">
          <TabBtn active={tab === "watch"} onClick={() => setTab("watch")} testId="tab-companion-watch">
            <Tv className="h-3.5 w-3.5" /> 吃饭看什么
          </TabBtn>
          <TabBtn active={tab === "topic"} onClick={() => setTab("topic")} testId="tab-companion-topic">
            <MessageCircle className="h-3.5 w-3.5" /> 今天聊什么
          </TabBtn>
          <TabBtn active={tab === "audio"} onClick={() => setTab("audio")} testId="tab-companion-audio">
            <Headphones className="h-3.5 w-3.5" /> 做饭听什么
          </TabBtn>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNonce((n) => n + 1)}
            data-testid="button-companion-refresh"
            className="ml-auto h-8 rounded-full text-[12px]"
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> 换一批
          </Button>
        </div>

        {/* 场景 / 心情 / 时段 chips:点击切换,再点取消 */}
        <div className="mt-3 space-y-2" data-testid="companion-chips">
          <ChipRow
            label="场景"
            testId="companion-chip-scene"
            chips={SCENE_CHIPS}
            active={scene}
            onPick={(v) => setScene((p) => (p === v ? null : v))}
          />
          <ChipRow
            label="心情"
            testId="companion-chip-mood"
            chips={MOOD_CHIPS}
            active={mood}
            onPick={(v) => setMood((p) => (p === v ? null : v))}
          />
          <ChipRow
            label="时段"
            testId="companion-chip-slot"
            chips={SLOT_CHIPS}
            active={slot}
            onPick={(v) => setSlot((p) => (p === v ? null : v))}
          />
        </div>

        <div className="mt-3">
          {tab === "watch" && <WatchList items={watch} />}
          {tab === "topic" && <TopicList items={topics} />}
          {tab === "audio" && <AudioList items={audio} />}
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          外链均为搜索入口,新窗口打开。所有推荐基于本地内置数据,不收集你的任何信息。
        </p>
      </Card>
    </section>
  );
}

function ChipRow<T extends string>({
  label,
  testId,
  chips,
  active,
  onPick,
}: {
  label: string;
  testId: string;
  chips: { id: T; label: string; emoji: string }[];
  active: T | null;
  onPick: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid={testId}>
      <span className="mr-0.5 shrink-0 text-[11.5px] text-muted-foreground">{label}</span>
      {chips.map((c) => {
        const on = active === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            aria-pressed={on}
            data-testid={`${testId}-${c.id}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors hover-elevate active-elevate-2 ${
              on
                ? "border-primary/60 bg-primary text-primary-foreground"
                : "border-border bg-card/60 text-foreground/80"
            }`}
          >
            <span aria-hidden>{c.emoji}</span>
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function SpecialPickRibbon({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-1 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-medium text-primary-foreground"
      data-testid="companion-special-ribbon"
    >
      <Sparkles className="h-3 w-3" />
      {children}
    </div>
  );
}

function TabBtn({
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
      role="tab"
      aria-selected={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors hover-elevate active-elevate-2 ${
        active
          ? "border-primary/50 bg-primary text-primary-foreground"
          : "border-border bg-card/60 text-foreground/80"
      }`}
    >
      {children}
    </button>
  );
}

function ExtLink({ href, children, testId }: { href: string; children: React.ReactNode; testId?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={testId}
      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11.5px] text-foreground/80 hover-elevate active-elevate-2"
    >
      {children}
      <ExternalLink className="h-3 w-3 opacity-70" />
    </a>
  );
}

function WatchList({ items }: { items: RecommendedWatch[] }) {
  if (items.length === 0) {
    return <p className="text-[12.5px] text-muted-foreground">暂无推荐,试试切换场景或换一批。</p>;
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2" data-testid="list-companion-watch">
      {items.map((it, idx) => {
        const links = buildSearchLinks(it.title, "video");
        const isSpecial = idx === 0;
        return (
          <li
            key={it.id}
            className={`rounded-xl border p-3 ${
              isSpecial
                ? "border-primary/50 bg-primary/5 sm:col-span-2"
                : "border-border/60 bg-background/40"
            }`}
            data-testid={`watch-${it.id}${isSpecial ? "-special" : ""}`}
          >
            {isSpecial && <SpecialPickRibbon>今天就选这个</SpecialPickRibbon>}
            <div className="flex items-start gap-3">
              <CompanionVisual title={it.title} kind="watch" typeHint={it.type} />
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-display text-[15px] tracking-tight">{it.title}</h4>
                <div className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10.5px]">
                    {it.type}
                  </Badge>
                  {it.duration && <span className="num">{it.duration}</span>}
                  {it.familyFriendly && (
                    <span className="rounded-full bg-primary/10 px-1.5 text-[10.5px] text-primary">合家欢</span>
                  )}
                  {it.kidSafe && (
                    <span className="rounded-full bg-emerald-100 px-1.5 text-[10.5px] text-emerald-700">儿童安全</span>
                  )}
                  {it.elderFriendly && (
                    <span className="rounded-full bg-amber-100 px-1.5 text-[10.5px] text-amber-700">长辈友好</span>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/85">
              <Sparkles className="mr-1 inline h-3 w-3 text-primary/80" />
              {it.reason}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {links.map((l) => (
                <ExtLink key={l.label} href={l.href} testId={`watch-link-${it.id}-${l.label}`}>
                  {l.label}
                </ExtLink>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TopicList({ items }: { items: RecommendedTopic[] }) {
  if (items.length === 0) {
    return <p className="text-[12.5px] text-muted-foreground">暂无话题,试试切换场景或换一批。</p>;
  }
  return (
    <ul className="grid gap-2" data-testid="list-companion-topic">
      {items.map((it, idx) => {
        const isSpecial = idx === 0;
        return (
        <li
          key={it.id}
          className={`rounded-xl border px-3 py-2.5 ${
            isSpecial ? "border-primary/50 bg-primary/5" : "border-border/60 bg-background/40"
          }`}
          data-testid={`topic-${it.id}${isSpecial ? "-special" : ""}`}
        >
          {isSpecial && <SpecialPickRibbon>今天就聊这个</SpecialPickRibbon>}
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[12px] text-primary num">{String(idx + 1).padStart(2, "0")}</span>
            <p className="text-[14px] leading-relaxed text-foreground">{it.text}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {it.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="outline" className="rounded-full px-1.5 py-0 text-[10.5px]">
                {t}
              </Badge>
            ))}
            <span className="text-[11px] text-muted-foreground">· {it.reason}</span>
          </div>
        </li>
        );
      })}
    </ul>
  );
}

function AudioList({ items }: { items: RecommendedAudio[] }) {
  if (items.length === 0) {
    return <p className="text-[12.5px] text-muted-foreground">暂无推荐,试试切换场景或换一批。</p>;
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2" data-testid="list-companion-audio">
      {items.map((it, idx) => {
        const links = buildSearchLinks(it.title, "audio");
        const isSpecial = idx === 0;
        return (
          <li
            key={it.id}
            className={`rounded-xl border p-3 ${
              isSpecial ? "border-primary/50 bg-primary/5 sm:col-span-2" : "border-border/60 bg-background/40"
            }`}
            data-testid={`audio-${it.id}${isSpecial ? "-special" : ""}`}
          >
            {isSpecial && <SpecialPickRibbon>今天就听这个</SpecialPickRibbon>}
            <div className="flex items-start gap-3">
              <CompanionVisual title={it.title} kind="audio" typeHint={it.type} />
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-display text-[15px] tracking-tight">{it.title}</h4>
                <div className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10.5px]">
                    {it.type}
                  </Badge>
                  <span className="rounded-full bg-primary/10 px-1.5 text-[10.5px] text-primary">
                    {it.length === "短" ? "短(快手)" : it.length === "中" ? "中" : "长(慢炖)"}
                  </span>
                  {it.kidSafe && (
                    <span className="rounded-full bg-emerald-100 px-1.5 text-[10.5px] text-emerald-700">亲子向</span>
                  )}
                  {it.elderFriendly && (
                    <span className="rounded-full bg-amber-100 px-1.5 text-[10.5px] text-amber-700">长辈友好</span>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/85">
              <Sparkles className="mr-1 inline h-3 w-3 text-primary/80" />
              {it.reason}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {links.map((l) => (
                <ExtLink key={l.label} href={l.href} testId={`audio-link-${it.id}-${l.label}`}>
                  {l.label}
                </ExtLink>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
