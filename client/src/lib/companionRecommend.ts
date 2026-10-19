// 「饭桌陪伴」推荐：吃饭看什么 / 今天聊什么 / 做饭听什么
// 内置数据 + 简单打分,无网络请求。家庭场景偏向合家欢、低争议。
//
// 输入:
//   - 当前 ScenarioId(如 family-dinner / kid-friendly / quick-work 等)
//   - 餐次 (MealSlot)
//   - 当前档案 (可选,提供性别 / 年龄,仅作软偏好)
//
// 输出:
//   - watch / topics / audio 各一组(可调数量),每条带"为什么推荐"。
//   - 同一份输入多次调用使用 nonce 可换一批。

import {
  WATCH_ITEMS,
  TOPIC_ITEMS,
  AUDIO_ITEMS,
  type WatchItem,
  type TopicItem,
  type AudioItem,
  type AudienceTag,
} from "@/data/companions";
import type { ScenarioId } from "./scenarios";
import type { MealSlot, Sex } from "./profile";

export interface CompanionContext {
  scenarioId: ScenarioId;
  servings: number;
  slot: MealSlot;
  /** 用户档案性别(可选,仅软偏好,不强行决定) */
  sex?: Sex;
  /** 用户年龄(可选) */
  age?: number;
  /** 是否带儿童(场景= kid-friendly 或服侍人数较多时建议设为 true) */
  hasKids?: boolean;
  /** 是否长辈友好场景 */
  elderHeavy?: boolean;
  /** 总用时上限(分钟),用于推荐音频长度 */
  maxTimeMinutes?: number;
  /** 用户在 CompanionPanel 内手动选择的「场景」覆盖,会覆写 scenarioId/servings 推断的受众 */
  sceneOverride?: "single" | "couple" | "family" | "friends" | "elder";
  /** 用户在 CompanionPanel 内手动选择的「心情」 */
  moodOverride?: "relax" | "laugh" | "down" | "learn" | "lively";
  /** 用户在 CompanionPanel 内手动选择的「时段」,会覆写 slot */
  slotOverride?: MealSlot | "midnight";
}

/** 场景覆盖映射到 audiences */
function audiencesFromSceneOverride(s: NonNullable<CompanionContext["sceneOverride"]>): AudienceTag[] {
  switch (s) {
    case "single":
      return ["单人"];
    case "couple":
      return ["双人", "情侣"];
    case "family":
      return ["全家", "儿童友好"];
    case "friends":
      return ["朋友"];
    case "elder":
      return ["全家", "长辈友好"];
  }
}

export function deriveCompanionAudiences(ctx: CompanionContext): AudienceTag[] {
  // 用户在 CompanionPanel 显式选了场景就直接采用,忽略原 ctx 推断,避免冲突
  if (ctx.sceneOverride) {
    return audiencesFromSceneOverride(ctx.sceneOverride);
  }
  const list: AudienceTag[] = [];
  const isFamily =
    ctx.scenarioId === "family-dinner" ||
    ctx.scenarioId === "kid-friendly" ||
    ctx.scenarioId === "elder-light" ||
    ctx.scenarioId === "weekend-cook" ||
    ctx.servings >= 4;
  if (isFamily) list.push("全家");
  if (ctx.scenarioId === "kid-friendly" || ctx.hasKids) list.push("儿童友好");
  if (ctx.scenarioId === "elder-light" || ctx.elderHeavy) list.push("长辈友好");
  if (ctx.servings === 1) list.push("单人");
  if (ctx.servings === 2) {
    list.push("双人");
    list.push("情侣");
  }
  if (ctx.servings >= 3 && ctx.servings <= 4 && !isFamily) list.push("朋友");
  if (list.length === 0) list.push("单人");
  return list;
}

/** 心情→影视/综艺的 mood 标签集合 */
function moodToWatchMoods(mood: CompanionContext["moodOverride"]): string[] {
  switch (mood) {
    case "relax":
      return ["轻松", "温馨", "下饭"];
    case "laugh":
      return ["搞笑"];
    case "down":
      return ["温馨", "怀旧", "下饭"];
    case "learn":
      return ["知识"];
    case "lively":
      return ["热血", "搞笑", "下饭"];
    default:
      return [];
  }
}

/** 心情→话题 tag 偏好 */
function moodToTopicTags(mood: CompanionContext["moodOverride"]): string[] {
  switch (mood) {
    case "relax":
      return ["轻松开场", "适合全家"];
    case "laugh":
      return ["轻松开场", "兴趣"];
    case "down":
      return ["回忆", "深聊一点"];
    case "learn":
      return ["兴趣", "工作"];
    case "lively":
      return ["轻松开场", "美食"];
    default:
      return [];
  }
}

/** 心情→音频 tag 偏好 */
function moodToAudioTags(mood: CompanionContext["moodOverride"]): string[] {
  switch (mood) {
    case "relax":
      return ["助眠", "做饭背景"];
    case "laugh":
      return ["搞笑"];
    case "down":
      return ["情感", "故事"];
    case "learn":
      return ["轻知识", "历史", "人文"];
    case "lively":
      return ["搞笑", "悬疑", "故事"];
    default:
      return [];
  }
}

function effectiveSlot(ctx: CompanionContext): MealSlot | "midnight" {
  return ctx.slotOverride ?? ctx.slot;
}

// === 共用打分 / 抽样工具 ===
function rand(): number {
  return Math.random();
}

function sampleTopK<T>(scored: { item: T; score: number }[], k: number): T[] {
  // 取前 k * 3 候选,再随机抽 k 条;避免每次都是同样的最高分。
  const pool = [...scored].sort((a, b) => b.score - a.score).slice(0, Math.max(k * 3, k + 4));
  const picked: T[] = [];
  while (picked.length < k && pool.length > 0) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool[idx].item);
    pool.splice(idx, 1);
  }
  return picked;
}

// === 看什么 ===
export interface RecommendedWatch extends WatchItem {
  reason: string;
}

export function recommendWatch(ctx: CompanionContext, count = 4): RecommendedWatch[] {
  const audiences = deriveCompanionAudiences(ctx);
  const isFamily = audiences.includes("全家");
  const isKidScene = audiences.includes("儿童友好");
  const isElderScene = audiences.includes("长辈友好");
  const wantedMoods = moodToWatchMoods(ctx.moodOverride);
  const slot = effectiveSlot(ctx);

  const scored = WATCH_ITEMS.map((it) => {
    let s = rand() * 0.6; // 随机扰动,保证可换一批
    let reasonHints: string[] = [];

    // 心情命中(优先级高,体现筛选效果)
    if (wantedMoods.length > 0) {
      const moodHits = it.moods.filter((m) => wantedMoods.includes(m as string)).length;
      if (moodHits > 0) {
        s += moodHits * 1.5;
        reasonHints.push(`配「${wantedMoods[0]}」心情`);
      } else {
        s -= 0.5;
      }
    }

    // 受众命中
    const hit = it.audiences.filter((a) => audiences.includes(a)).length;
    s += hit * 1.3;
    if (hit > 0) {
      const matched = it.audiences.find((a) => audiences.includes(a));
      if (matched) reasonHints.push(`适合「${matched}」`);
    }

    // 家庭场景:合家欢、儿童安全、长辈友好都加大分
    if (isFamily) {
      if (it.familyFriendly) {
        s += 1.4;
        reasonHints.push("合家欢内容");
      } else {
        s -= 0.6;
      }
      if (isKidScene && it.kidSafe) {
        s += 1.0;
        reasonHints.push("儿童安全");
      }
      if (isElderScene && it.elderFriendly) {
        s += 0.9;
        reasonHints.push("长辈也喜欢");
      }
    }

    // 单人偏向短一点 / 不烧脑
    if (audiences.includes("单人")) {
      if (it.type === "电视剧" || it.type === "动画" || it.type === "综艺") s += 0.4;
      if (it.moods.includes("下饭") || it.moods.includes("美食") || it.moods.includes("温馨")) s += 0.3;
    }

    // 情侣 / 双人:温馨 + 节奏舒服
    if (audiences.includes("情侣") || audiences.includes("双人")) {
      if (it.moods.includes("温馨") || it.moods.includes("怀旧")) s += 0.4;
    }

    // 朋友聚餐:搞笑、热血优先
    if (audiences.includes("朋友") && !isFamily) {
      if (it.moods.includes("搞笑") || it.moods.includes("热血")) s += 0.5;
    }

    // 餐次:午餐 / 晚餐倾向「下饭」「美食」;早餐倾向「轻松」「温馨」;夜宵倾向短 + 搞笑
    if (slot === "dinner" && (it.moods.includes("下饭") || it.moods.includes("美食"))) s += 0.3;
    if (slot === "breakfast" && (it.moods.includes("轻松") || it.moods.includes("温馨"))) s += 0.2;
    if (slot === "midnight" && (it.moods.includes("搞笑") || it.moods.includes("下饭"))) s += 0.3;

    // 年龄软偏好(不硬过滤,只对符合的内容加分)
    if (typeof ctx.age === "number") {
      const hasMin = typeof it.ageMin === "number";
      if (hasMin && ctx.age < (it.ageMin ?? 0) - 2) {
        // 远低于建议年龄:扣分但不排除
        s -= 1.0;
      }
    }

    // 性别仅作非常软偏好,且只在很少几个明显作品上;此处不做性别决定。
    // (有意为之:避免刻板印象)

    // 兜底 reason
    if (reasonHints.length === 0) reasonHints.push(it.why);

    const reason = `${it.why} · ${reasonHints.slice(0, 2).join(" · ")}`;

    return { item: it, score: s, reason };
  });

  const picked = sampleTopK(scored, count);
  return picked.map((it) => {
    const found = scored.find((s) => s.item.id === it.id);
    return { ...it, reason: found?.reason ?? it.why };
  });
}

// === 聊什么 ===
export interface RecommendedTopic extends TopicItem {
  reason: string;
}

export function recommendTopics(ctx: CompanionContext, count = 5): RecommendedTopic[] {
  const audiences = deriveCompanionAudiences(ctx);
  const isFamily = audiences.includes("全家");
  const isKidScene = audiences.includes("儿童友好");
  const isElderScene = audiences.includes("长辈友好");
  const wantedTopicTags = moodToTopicTags(ctx.moodOverride);
  const slot = effectiveSlot(ctx);

  const scored = TOPIC_ITEMS.map((it) => {
    let s = rand() * 0.6;
    const reasonHints: string[] = [];

    // 心情命中
    if (wantedTopicTags.length > 0) {
      const moodHits = it.tags.filter((t) => wantedTopicTags.includes(t as string)).length;
      if (moodHits > 0) {
        s += moodHits * 1.4;
        reasonHints.push(`配心情`);
      }
    }

    // 受众命中
    const hit = it.audiences.filter((a) => audiences.includes(a)).length;
    s += hit * 1.4;

    // 家庭场景:必须 familyFriendly,否则强烈降权
    if (isFamily) {
      if (it.familyFriendly) {
        s += 1.0;
      } else {
        s -= 1.5;
      }
      if (isKidScene && it.kidSafe) {
        s += 1.0;
        reasonHints.push("儿童也能参与");
      }
      if (isElderScene && it.elderFriendly) {
        s += 0.8;
        reasonHints.push("长辈聊得起来");
      }
      if (it.tags.includes("适合全家")) {
        s += 0.6;
        reasonHints.push("适合全家");
      }
      if (it.tags.includes("亲子") && (isKidScene || ctx.servings >= 3)) {
        s += 0.5;
      }
      // 家庭场景避开深聊;避免敏感
      if (it.tags.includes("深聊一点") && !isElderScene) s -= 0.3;
    } else {
      // 双人 / 情侣 / 朋友:可以接深聊
      if (it.tags.includes("深聊一点") && (audiences.includes("情侣") || audiences.includes("双人"))) {
        s += 0.6;
        reasonHints.push("适合两个人深聊");
      }
      if (audiences.includes("朋友") && it.tags.includes("轻松开场")) {
        s += 0.4;
      }
    }

    // 餐次:晚餐多温馨回忆;午餐多轻松开场;早餐 / 夜宵偏轻松
    if (slot === "dinner" && (it.tags.includes("回忆") || it.tags.includes("适合全家"))) s += 0.2;
    if (slot === "lunch" && it.tags.includes("轻松开场")) s += 0.2;
    if ((slot === "breakfast" || slot === "midnight") && it.tags.includes("轻松开场")) s += 0.2;

    // 兜底 reason
    if (reasonHints.length === 0) {
      if (it.tags.includes("轻松开场")) reasonHints.push("轻松开场,不冷场");
      else if (it.tags.includes("回忆")) reasonHints.push("有回忆点,容易接话");
      else reasonHints.push("适合当前场景");
    }

    return { item: it, score: s, reason: reasonHints.slice(0, 2).join(" · ") };
  });

  const picked = sampleTopK(scored, count);
  return picked.map((it) => {
    const found = scored.find((s) => s.item.id === it.id);
    return { ...it, reason: found?.reason ?? "适合当前场景" };
  });
}

// === 听什么 ===
export interface RecommendedAudio extends AudioItem {
  reason: string;
}

export function recommendAudio(ctx: CompanionContext, count = 4): RecommendedAudio[] {
  const audiences = deriveCompanionAudiences(ctx);
  const isFamily = audiences.includes("全家");
  const isKidScene = audiences.includes("儿童友好");
  const isElderScene = audiences.includes("长辈友好");
  const wantedAudioTags = moodToAudioTags(ctx.moodOverride);
  const slot = effectiveSlot(ctx);

  // 根据用时推荐长度:短(<25)、中(25~60)、长(>60)
  const t = ctx.maxTimeMinutes ?? 45;
  const desiredLengths: AudioItem["length"][] =
    t <= 25 ? ["短"] : t <= 60 ? ["短", "中"] : ["中", "长"];

  const scored = AUDIO_ITEMS.map((it) => {
    let s = rand() * 0.5;
    const reasonHints: string[] = [];

    // 心情命中
    if (wantedAudioTags.length > 0) {
      const moodHits = it.tags.filter((t) => wantedAudioTags.includes(t as string)).length;
      if (moodHits > 0) {
        s += moodHits * 1.4;
        reasonHints.push(`配心情`);
      }
    }

    if (desiredLengths.includes(it.length)) {
      s += 1.2;
      reasonHints.push(it.length === "短" ? "短音频,快手菜搭" : it.length === "中" ? "中等长度,日常做菜刚好" : "长篇,周末慢炖陪着");
    } else {
      s -= 0.5;
    }

    const hit = it.audiences.filter((a) => audiences.includes(a)).length;
    s += hit * 1.0;

    if (isKidScene) {
      if (it.kidSafe || it.tags.includes("亲子")) {
        s += 1.5;
        reasonHints.push("亲子向");
      } else {
        s -= 1.0;
      }
    }

    if (isFamily && !isKidScene) {
      // 家庭聚餐做菜:偏向背景音 / 经典 / 长辈也接受的
      if (it.tags.includes("做饭背景") || it.tags.includes("历史") || it.elderFriendly) {
        s += 0.8;
      }
    }

    if (isElderScene) {
      if (it.elderFriendly) {
        s += 0.8;
        reasonHints.push("长辈也喜欢");
      } else {
        s -= 0.4;
      }
    }

    // 餐次:早餐倾向短音频;晚餐 / 周末倾向中长篇;夜宵倾向短 + 助眠
    if (slot === "breakfast" && it.length === "短") s += 0.3;
    if (slot === "dinner" && (it.length === "中" || it.length === "长")) s += 0.2;
    if (slot === "midnight" && (it.length === "短" || it.tags.includes("助眠"))) s += 0.3;

    if (reasonHints.length === 0) reasonHints.push(it.why);

    const reason = `${it.why}`;
    return { item: it, score: s, reason };
  });

  const picked = sampleTopK(scored, count);
  return picked.map((it) => {
    const found = scored.find((s) => s.item.id === it.id);
    return { ...it, reason: found?.reason ?? it.why };
  });
}
