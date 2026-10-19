// 「今晚最终方案」持久化存储 — 用户在 #/solo 或 #/family-tonight 点击「就按这个」
// 后，把当前一键结果整体快照沉淀下来，可在 #/tonight-plan 查看 / 复制 / 分享。
//
// - 仅存最近一份 final plan（覆盖式），不做历史。
// - 走 safeGet/safeSet（隐私模式自动退回内存态），不直接读写 localStorage。
// - 所有字段都是可选的：单人方案不一定有家庭兼容、家庭方案不一定有零食。

import { useSyncExternalStore } from "react";
import { readJSON, writeJSON, safeRemove } from "./storage";

export type TonightPlanKind = "solo" | "family";

export interface TonightPlanLink {
  label: string;
  href: string;
}

export interface TonightPlanLine {
  /** 显示标签：主餐 / 配菜 / 汤主食 / 外卖 / 零食 / 水果 / 喝点啥 / 看 / 听 */
  label: string;
  /** 主体内容 */
  text: string;
  /** 副文本（理由、时间、价格等，可选） */
  detail?: string;
  /** 一个深链（搜做法 / 美团搜 / 喜马拉雅搜，可选） */
  link?: TonightPlanLink;
}

export interface TonightPlan {
  /** 单人 / 家庭 */
  kind: TonightPlanKind;
  /** 一句话标题（main summary） */
  title: string;
  /** 适用人群描述：如「单人」「3-4 人 · 正常档」 */
  audience: string;
  /** 生成时间 ISO 字符串 */
  createdAt: string;
  /** 心情/倾向标签（chip 显示） */
  tags: string[];
  /** 主要分区行（按顺序展示） */
  lines: TonightPlanLine[];
  /** 一句安慰话 / 鼓励话（可选） */
  quote?: string;
  /** 预算估算（人民币元，可选） */
  budget?: number;
  /** 热量估算（kcal，可选；家庭方案通常省略） */
  calories?: number;
  /** 家庭兼容总评：green/amber/red（可选） */
  familyCompat?: "green" | "amber" | "red";
  /** 家庭兼容明细行 */
  familyCompatLines?: string[];
  /** 冰箱命中（家庭方案） */
  fridgeMatched?: string[];
  /** 冰箱缺料（家庭方案） */
  fridgeMissing?: string[];
  /** 剩菜改造提示（家庭方案） */
  remixHint?: string;
  /** 明天衔接（家庭方案） */
  tomorrowHint?: string;
}

const KEY = "chishenme.tonightPlan.v1";

let cache: TonightPlan | null | undefined;
const listeners = new Set<() => void>();

function load(): TonightPlan | null {
  if (cache !== undefined) return cache;
  cache = readJSON<TonightPlan | null>(KEY, null);
  return cache ?? null;
}

function persist(): void {
  if (cache === null) {
    safeRemove(KEY);
  } else if (cache) {
    writeJSON(KEY, cache);
  }
  listeners.forEach((l) => l());
}

export function getTonightPlan(): TonightPlan | null {
  return load();
}

export function setTonightPlan(plan: TonightPlan): void {
  cache = plan;
  persist();
}

export function clearTonightPlan(): void {
  cache = null;
  persist();
}

export function subscribeTonightPlan(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** React 18 useSyncExternalStore：组件读取最新 final plan。 */
export function useTonightPlan(): TonightPlan | null {
  return useSyncExternalStore(subscribeTonightPlan, getTonightPlan, getTonightPlan);
}

/** 把方案格式化成可复制的纯文本，给「复制方案」按钮用。 */
export function formatTonightPlanText(plan: TonightPlan): string {
  const out: string[] = [];
  const date = (() => {
    try {
      const d = new Date(plan.createdAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  })();
  out.push(`【今晚最终方案】${plan.title}`);
  out.push(`适用：${plan.audience}${date ? ` · ${date}` : ""}`);
  if (plan.tags.length > 0) out.push(`标签：${plan.tags.join(" · ")}`);
  out.push("");
  for (const ln of plan.lines) {
    let row = `· ${ln.label}：${ln.text}`;
    if (ln.detail) row += `（${ln.detail}）`;
    out.push(row);
  }
  if (plan.familyCompat) {
    const txt =
      plan.familyCompat === "green"
        ? "全家兼容"
        : plan.familyCompat === "amber"
          ? "部分兼容 · 注意调整"
          : "有冲突 · 注意过敏/忌口";
    out.push("");
    out.push(`家庭兼容：${txt}`);
    if (plan.familyCompatLines && plan.familyCompatLines.length > 0) {
      for (const l of plan.familyCompatLines) out.push(`  - ${l}`);
    }
  }
  if (plan.fridgeMatched && plan.fridgeMatched.length > 0) {
    out.push(`冰箱可用：${plan.fridgeMatched.join(" · ")}`);
  }
  if (plan.fridgeMissing && plan.fridgeMissing.length > 0) {
    out.push(`还需买：${plan.fridgeMissing.join(" · ")}`);
  }
  if (plan.remixHint) out.push(`剩菜改造：${plan.remixHint}`);
  if (plan.tomorrowHint) out.push(`明天衔接：${plan.tomorrowHint}`);
  if (typeof plan.budget === "number") out.push(`预算估算：约 ¥${plan.budget}`);
  if (typeof plan.calories === "number") out.push(`热量估算：约 ${plan.calories} kcal`);
  if (plan.quote) {
    out.push("");
    out.push(`💬 ${plan.quote}`);
  }
  out.push("");
  out.push("— 来自「今天吃什么 · 饭搭子」");
  return out.join("\n");
}
