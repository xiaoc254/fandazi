// 链接稳健性冒烟测试（不联网）：确保我们生成的所有外链都是「稳定搜索 URL」，
// 而不是已知 error_page 的商家直链。
//
// 规则：
//  1. 所有 URL 必须是合法 https URL；
//  2. 不能匹配「已知坏链白名单」（美团 H5 awp、m.dianping.com searchshop 等）；
//  3. 必须命中「稳定搜索 host 白名单」（baidu / s.taobao / search.jd / douyin / xiaohongshu / bilibili / weibo / zhihu / toutiao / ele.me 搜索路径 / ximalaya / weread / qq / iqiyi / douban / 163 music / xiaoyuzhoufm）。
//
// 任意失败将以非 0 退出码结束，方便后续接入 CI。

import { PLATFORMS } from "../client/src/data/takeout";
import { snackSearchLinks } from "../client/src/data/snacks";

// 与 FoodImage.stableSearchUrl 保持同步（避免 import tsx 引入 React 运行时）。
function stableSearchUrl(label: "美团" | "淘宝" | "京东" | "百度" | "饿了么" | "美团闪购", q: string): string {
  const enc = encodeURIComponent(q);
  switch (label) {
    case "美团":
      return `https://www.baidu.com/s?wd=${encodeURIComponent("site:meituan.com 外卖 " + q)}`;
    case "美团闪购":
      return `https://www.baidu.com/s?wd=${encodeURIComponent("美团闪购 " + q)}`;
    case "饿了么":
      return `https://www.baidu.com/s?wd=${encodeURIComponent("site:ele.me 外卖 " + q)}`;
    case "京东":
      return `https://search.jd.com/Search?keyword=${enc}`;
    case "淘宝":
      return `https://s.taobao.com/search?q=${enc}`;
    case "百度":
    default:
      return `https://www.baidu.com/s?wd=${enc}`;
  }
}

const SAMPLE_QUERIES = ["麦当劳", "西湖醋鱼", "酸奶", "苹果", "麻辣烫"];

const KNOWN_BAD_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /i\.meituan\.com\/awp\//, label: "美团 H5 awp 直达常 error_page" },
  { pattern: /m\.dianping\.com\/searchshop/, label: "大众点评 m.dianping searchshop 常 error_page" },
];

const STABLE_HOST_PATTERNS = [
  /^https:\/\/www\.baidu\.com\/s\?/,
  /^https:\/\/search\.jd\.com\/Search\?/,
  /^https:\/\/s\.taobao\.com\/search\?/,
  /^https:\/\/www\.douyin\.com\/search\//,
  /^https:\/\/www\.xiaohongshu\.com\/search_result\?/,
  /^https:\/\/search\.bilibili\.com\/all\?/,
  /^https:\/\/s\.weibo\.com\/weibo\?/,
  /^https:\/\/www\.zhihu\.com\/search\?/,
  /^https:\/\/so\.toutiao\.com\/search\?/,
  /^https:\/\/www\.ele\.me\/search\?/,
];

let failed = 0;
function check(label: string, url: string) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") {
      failed++;
      console.error(`  ✗ ${label} — 非 https：${url}`);
      return;
    }
  } catch {
    failed++;
    console.error(`  ✗ ${label} — URL 不合法：${url}`);
    return;
  }
  for (const bad of KNOWN_BAD_PATTERNS) {
    if (bad.pattern.test(url)) {
      failed++;
      console.error(`  ✗ ${label} — 命中坏链白名单（${bad.label}）：${url}`);
      return;
    }
  }
  if (!STABLE_HOST_PATTERNS.some((p) => p.test(url))) {
    failed++;
    console.error(`  ✗ ${label} — 未命中稳定 host 白名单：${url}`);
    return;
  }
  console.log(`  ✓ ${label}`);
}

console.log("== 外卖平台搜索入口 ==");
for (const p of PLATFORMS) {
  for (const q of SAMPLE_QUERIES) {
    check(`${p.label} · "${q}"`, p.buildSearch(q));
  }
}

console.log("== 零食 / 水果 搜索入口 ==");
for (const q of SAMPLE_QUERIES) {
  for (const link of snackSearchLinks(q)) {
    check(`${link.label} · "${q}"`, link.href);
  }
}

console.log("== stableSearchUrl 工具 ==");
for (const label of ["美团", "美团闪购", "饿了么", "京东", "淘宝", "百度"] as const) {
  for (const q of SAMPLE_QUERIES.slice(0, 2)) {
    check(`${label} · "${q}"`, stableSearchUrl(label, q));
  }
}

if (failed > 0) {
  console.error(`\n✗ 发现 ${failed} 个不稳定链接`);
  process.exit(1);
} else {
  console.log("\n✓ 所有链接通过稳定性白名单");
}
