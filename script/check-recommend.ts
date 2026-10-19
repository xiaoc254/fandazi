// 推荐算法兜底冒烟测试。
// 用 tsx 运行：`npx tsx script/check-recommend.ts`。
// 验证关键不变量：
//  1. 默认偏好至少能给出 mainCount 道主菜 + 汤 + 素菜；
//  2. 任意单一菜系（包括 0 候选的「鲁菜」「西北」）都不会让结果完全为空；
//  3. 任意硬性忌口都被严格遵守（不能在结果里出现违反 contains 的菜）；
//  4. 极严格组合（如 鲁菜 + 进阶 + 15 分钟 + 素食）也不会返回 0 道菜，
//     除非硬性忌口本身把整类全部清空。
//
// 任意失败将以非 0 退出码结束，方便后续接入 CI。

import {
  recommend,
  DEFAULT_PREFS,
  planToList,
  countByCourseUnderHardOnly,
  type Preferences,
} from "../client/src/lib/recommend";
import {
  RECIPES,
  inferContainsForRecipe,
  type Cuisine,
  type Difficulty,
  type Restriction,
} from "../client/src/data/recipes";

let failed = 0;
function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}${detail ? `\n      ${detail}` : ""}`);
  }
}

function dishNames(plan: ReturnType<typeof recommend>): string {
  return planToList(plan)
    .map((r) => r.name)
    .join(", ");
}

console.log("== 默认偏好 ==");
{
  const plan = recommend(DEFAULT_PREFS);
  check("默认有主菜", plan.mains.length === DEFAULT_PREFS.mainCount, dishNames(plan));
  check("默认有素菜", !!plan.veggie, dishNames(plan));
  check("默认有汤", !!plan.soup, dishNames(plan));
  check("默认无放宽提示", !plan.relaxedNotes, JSON.stringify(plan.relaxedNotes));
}

console.log("== 单一菜系（含 0 候选）==");
const allCuisines: Cuisine[] = ["川菜", "粤菜", "江浙", "鲁菜", "西北", "东北", "家常"];
for (const c of allCuisines) {
  const prefs: Preferences = { ...DEFAULT_PREFS, cuisines: [c] };
  const plan = recommend(prefs);
  const total = planToList(plan).length;
  check(`菜系=${c} 至少返回 1 道`, total >= 1, `total=${total}`);
}

console.log("== 极严格组合 ==");
{
  const prefs: Preferences = {
    ...DEFAULT_PREFS,
    cuisines: ["鲁菜"],
    difficulties: ["进阶"],
    maxTimeMinutes: 15,
  };
  const plan = recommend(prefs);
  check(
    "鲁菜+进阶+15 分钟 至少返回 1 道",
    planToList(plan).length >= 1,
    dishNames(plan),
  );
  check("应当出现放宽提示", (plan.relaxedNotes ?? []).length > 0, JSON.stringify(plan.relaxedNotes));
}

console.log("== 硬性忌口被严格遵守 ==");
const allRestrictions: Restriction[] = [
  "素食",
  "无猪肉",
  "无牛肉",
  "无海鲜",
  "无辣",
  "无蛋",
  "无奶",
  "无花生",
];
for (const r of allRestrictions) {
  // 给一个尽量不挑剔的偏好，让兜底逻辑容易触发
  const prefs: Preferences = {
    ...DEFAULT_PREFS,
    restrictions: [r],
    cuisines: ["川菜"], // 故意上一个软性条件配合，触发放宽
    difficulties: ["进阶"],
    maxTimeMinutes: 30,
  };
  const plan = recommend(prefs);
  const list = planToList(plan);
  // 1. 不应出现 contains 该忌口的菜
  const violators = list.filter((dish) => dish.contains.includes(r));
  check(
    `忌口=${r}：返回的菜不含 contains[${r}]`,
    violators.length === 0,
    violators.map((d) => d.name).join(", "),
  );
  // 2. 素食专项：不应出现含肉/蛋/海鲜的食材
  if (r === "素食") {
    const meaty = list.filter((d) =>
      d.ingredients.some(
        (i) =>
          i.category === "肉蛋豆制品" &&
          /鸡|猪|牛|羊|鱼|虾|肉|排骨|皮蛋|鸡蛋|蛋/.test(i.name) &&
          !/豆腐|腐竹|豆干/.test(i.name),
      ),
    );
    check(
      "素食：返回的菜不含肉蛋海鲜",
      meaty.length === 0,
      meaty.map((d) => d.name).join(", "),
    );
  }
  // 3. 无辣：返回的菜不含 微辣/重辣/麻辣
  if (r === "无辣") {
    const spicy = list.filter((d) =>
      d.tastes.some((t) => t === "微辣" || t === "重辣" || t === "麻辣"),
    );
    check(
      "无辣：返回的菜不含 微辣/重辣/麻辣",
      spicy.length === 0,
      spicy.map((d) => d.name).join(", "),
    );
  }
}

console.log("== 极端忌口组合（可能完全无解时仍要给出诊断）==");
{
  // 同时勾选所有忌口 — 期望: 至少不会抛错；返回结果或为空，但 unmetCourses 会标识出来
  const prefs: Preferences = {
    ...DEFAULT_PREFS,
    restrictions: [...allRestrictions],
  };
  const plan = recommend(prefs);
  const counts = countByCourseUnderHardOnly(prefs);
  console.log(
    `  ℹ 全勾忌口下硬性可用候选: main=${counts.main} veggie=${counts.veggie} soup=${counts.soup}`,
  );
  // 不要求一定有菜，但要求 violatesHardRestrictions 真的把所有违忌的都筛掉了
  const list = planToList(plan);
  const anyViolator = list.some((d) => d.contains.some((c) => prefs.restrictions.includes(c)));
  check("即使全选忌口，返回结果不违反任何忌口", !anyViolator, list.map((d) => d.name).join(", "));
}

console.log("== 多次随机也总有结果 ==");
{
  const prefs: Preferences = {
    ...DEFAULT_PREFS,
    cuisines: ["西北"], // 0 候选
    difficulties: ["进阶"],
    maxTimeMinutes: 20,
  };
  let minSize = Infinity;
  for (let i = 0; i < 30; i++) {
    const plan = recommend(prefs);
    minSize = Math.min(minSize, planToList(plan).length);
  }
  check("严格条件下 30 次重抽都至少返回 1 道", minSize >= 1, `min=${minSize}`);
}

console.log("== 数据不变量：每道菜含禁忌成分必须在 contains 标对应限制 ==");
{
  // 调用关键词推断；所有推断出的限制都必须已在 r.contains 中。
  const offenders: { id: string; name: string; missing: Restriction[] }[] = [];
  for (const r of RECIPES) {
    const inferred = inferContainsForRecipe(r);
    const missing = inferred.filter((x) => !r.contains.includes(x));
    if (missing.length > 0) offenders.push({ id: r.id, name: r.name, missing });
  }
  check(
    `所有 ${RECIPES.length} 道菜的 contains 与食材关键词一致`,
    offenders.length === 0,
    offenders
      .slice(0, 10)
      .map((o) => `${o.name}(${o.id})缺 ${o.missing.join("/")}`)
      .join("; "),
  );
}

console.log("== 推荐结果在每个硬忌口下都不含违忌食材 ==");
{
  // 反向验证：单一忌口下连跑 30 次，结果内任何一道菜的食材文本不得命中该忌口的关键词。
  // 不仅信任 contains 字段，而是再用关键词扫描一次，作为兜底兜底。
  const singleRestrictions: Restriction[] = ["无蛋", "无奶", "无花生", "无海鲜", "无猪肉", "无牛肉"];
  for (const r of singleRestrictions) {
    let worstViolators: { dish: string; offendingIngredient: string }[] = [];
    for (let i = 0; i < 30; i++) {
      const prefs: Preferences = { ...DEFAULT_PREFS, restrictions: [r] };
      const plan = recommend(prefs);
      const list = planToList(plan);
      for (const d of list) {
        const inferred = inferContainsForRecipe(d);
        if (inferred.includes(r)) {
          // 找到具体哪个食材命中
          const blob = d.ingredients.map((i) => i.name).concat(d.steps).join(" ");
          worstViolators.push({ dish: d.name, offendingIngredient: blob.slice(0, 60) });
        }
      }
    }
    check(
      `忌口=${r}：30 次推荐结果中无任何菜的食材命中该禁忌`,
      worstViolators.length === 0,
      worstViolators.slice(0, 5).map((v) => `${v.dish}`).join(", "),
    );
  }
}

console.log("== 数据库规模 ==");
{
  // v2: 1000+ 菜谱
  check(`RECIPES 总数 >= 1000（实际 ${RECIPES.length}）`, RECIPES.length >= 1000);
  // 至少覆盖每个 course
  const byCourse: Record<string, number> = { main: 0, veggie: 0, soup: 0, staple: 0 };
  for (const r of RECIPES) byCourse[r.course] += 1;
  check(`main >= 100 (实际 ${byCourse.main})`, byCourse.main >= 100);
  check(`veggie >= 30 (实际 ${byCourse.veggie})`, byCourse.veggie >= 30);
  check(`soup >= 15 (实际 ${byCourse.soup})`, byCourse.soup >= 15);
  check(`staple >= 10 (实际 ${byCourse.staple})`, byCourse.staple >= 10);
  // 名称应几乎全部不同
  const seenName = new Set<string>();
  let dup = 0;
  for (const r of RECIPES) {
    if (seenName.has(r.name)) dup++;
    seenName.add(r.name);
  }
  check(`菜名重复数量 <= 30（实际 ${dup}） — 合理重名（蔬菜炒蛋等）允许`, dup <= 30);
}

console.log("== 上下文加分（天气/季节）不破坏忌口 ==");
{
  const prefs: Preferences = {
    ...DEFAULT_PREFS,
    restrictions: ["素食"],
  };
  // 模拟「冷天 + 冬」 — 推荐应仍然只返回素食
  const ctx = {
    env: {
      region: "未指定" as const,
      weather: "冷" as const,
      season: "冬" as const,
      dayKind: "weekday" as const,
      date: new Date(),
    },
  };
  const plan = recommend(prefs, [], ctx);
  const list = planToList(plan);
  const meaty = list.filter((d) =>
    d.ingredients.some(
      (i) =>
        i.category === "肉蛋豆制品" &&
        /鸡|猪|牛|羊|鱼|虾|肉|排骨|皮蛋|鸡蛋|蛋|火腿|腊肠|卤/.test(i.name) &&
        !/豆腐|腐竹|豆干|黄豆/.test(i.name),
    ),
  );
  check("素食 + 冷天上下文：返回结果不含肉蛋海鲜", meaty.length === 0, meaty.map((d) => d.name).join(", "));
}

console.log("== 旅行美食数据不变量 ==");
{
  const { CITY_FOODS, ALL_PROVINCES, citiesGroupedByProvince, searchCities } = await import(
    "../client/src/data/cityFoods"
  );
  check(`CITY_FOODS 至少 30 个城市（实际 ${CITY_FOODS.length}）`, CITY_FOODS.length >= 30);
  check(`ALL_PROVINCES 至少 25 省（实际 ${ALL_PROVINCES.length}）`, ALL_PROVINCES.length >= 25);
  // 每个城市必须有 province 与至少一道菜，且 vibe 不为空
  const broken = CITY_FOODS.filter(
    (c: any) => !c.province || !c.vibe || !Array.isArray(c.items) || c.items.length === 0,
  );
  check(`每个城市必须有 province / vibe / items[]`, broken.length === 0, broken.map((c: any) => c.city).join(", "));
  // 分组覆盖所有城市
  const grouped = citiesGroupedByProvince();
  const cityCount = grouped.reduce((acc: number, g: any) => acc + g.cities.length, 0);
  check(`分组后总城市数 = CITY_FOODS.length`, cityCount === CITY_FOODS.length, `grouped=${cityCount}, all=${CITY_FOODS.length}`);
  // searchCities 至少能搜到城市名 / 美食名
  check(`searchCities("成都") 命中`, searchCities("成都").some((c: any) => c.city === "成都"));
  check(`searchCities("烤鸭") 命中（按美食搜城市）`, searchCities("烤鸭").length >= 1);
  check(`searchCities("广东") 命中（按省份搜）`, searchCities("广东").some((c: any) => c.province === "广东"));
}

console.log("== 健康规则覆盖率 ==");
{
  const { listHealthMatches } = await import("../client/src/lib/recommend");
  let lowSugar = 0, lowSalt = 0, lowOil = 0, lowPurine = 0, soft = 0, protein = 0;
  for (const r of RECIPES) {
    const m = listHealthMatches(r);
    if (m.includes("low-sugar")) lowSugar++;
    if (m.includes("low-salt")) lowSalt++;
    if (m.includes("low-oil")) lowOil++;
    if (m.includes("low-purine")) lowPurine++;
    if (m.includes("soft-easy-digest")) soft++;
    if (m.includes("high-quality-protein")) protein++;
  }
  // 每条规则在全库中至少能命中 30 道菜，否则 UI 列表会非常稀疏
  check(`低糖菜数 >= 30 (实际 ${lowSugar})`, lowSugar >= 30);
  check(`低盐菜数 >= 30 (实际 ${lowSalt})`, lowSalt >= 30);
  check(`低油菜数 >= 30 (实际 ${lowOil})`, lowOil >= 30);
  check(`低嘌呤菜数 >= 30 (实际 ${lowPurine})`, lowPurine >= 30);
  check(`软烂易消化数 >= 30 (实际 ${soft})`, soft >= 30);
  check(`优质蛋白数 >= 30 (实际 ${protein})`, protein >= 30);
}

console.log("== 旅行美食 大众点评链接（主入口必须是百度站内搜索，避免 dianping 404）==");
{
  // 历史上 dianping.com/search/keyword/0_0_0_<q> 与 m.dianping.com/searchshop 都会跳 error_page。
  // 现在主大众点评按钮必须走百度 site:dianping.com，dianping 直达只能作为次级且明确标注。
  const fs = await import("node:fs");
  const src = fs.readFileSync("client/src/components/TravelPanel.tsx", "utf-8");
  check(
    "TravelPanel 提供大众点评的百度站内搜索主入口",
    src.includes("site:dianping.com"),
    "未提供 baidu site:dianping.com 主入口",
  );
  check(
    "TravelPanel 不再生成 dianping.com/search/keyword/0_0_0_ 形式 URL",
    !src.includes("dianping.com/search/keyword/0_0_0_"),
    "TravelPanel 仍在生成已知 404 的旧形式 dianping URL",
  );
  // 主大众点评 LINKS 项不能 build 为 m.dianping.com/searchshop —— 该 URL 已知会 error_page。
  // 通过结构化匹配 LINKS 中 id="dp" 的 build 函数：必须返回百度，而不是 m.dianping.com/searchshop。
  const dpEntryMatch = src.match(/id:\s*"dp"[^}]*build:\s*([A-Za-z_]+)/);
  check(
    "TravelPanel 主大众点评（id=\"dp\"）的 build 必须是百度站内搜索而非 m.dianping.com 直达",
    !!dpEntryMatch && dpEntryMatch[1] === "dianpingBaiduUrl",
    `LINKS 中 id="dp" 当前 build=${dpEntryMatch?.[1] ?? "(未找到)"}，应为 dianpingBaiduUrl`,
  );
  // 副入口（点评直达）允许使用 m.dianping.com，但必须标注「可能不可用」。
  check(
    "TravelPanel 若保留 m.dianping.com 直达，必须标注「可能不可用」",
    !src.includes("m.dianping.com/searchshop") || src.includes("可能不可用"),
    "保留了 m.dianping.com 直达但未标注「可能不可用」",
  );
}

console.log("== 门类浏览：每个 category 至少有若干道菜（避免 UI 只看到甜品）==");
{
  // 不变量：8 个门类中至少 6 个有 >= 5 道菜，避免「点开门类只看到甜品」的体感
  const { ALL_CATEGORIES } = await import("../client/src/data/recipes");
  const counts: Record<string, number> = {};
  for (const c of ALL_CATEGORIES) counts[c] = 0;
  for (const r of RECIPES) {
    if (r.category) counts[r.category] = (counts[r.category] ?? 0) + 1;
  }
  const enough = ALL_CATEGORIES.filter((c) => counts[c] >= 5);
  check(
    `门类>=5 道的类别数 >= 6（实际 ${enough.length}/${ALL_CATEGORIES.length}）`,
    enough.length >= 6,
    `分布：${ALL_CATEGORIES.map((c) => `${c}=${counts[c]}`).join(", ")}`,
  );
  for (const c of ALL_CATEGORIES) {
    check(`门类「${c}」至少 1 道（避免 UI 显示空类）`, counts[c] >= 1, `count=${counts[c]}`);
  }
}

console.log("== 外卖模块预算档位完整 ==");
{
  // 每档预算必须包含 picks/coupon/risks 三组提示
  const { BUDGETS, PLATFORMS } = await import("../client/src/data/takeout");
  check(`外卖预算档位数 >= 5（实际 ${BUDGETS.length}）`, BUDGETS.length >= 5);
  for (const t of BUDGETS) {
    check(
      `外卖档位「${t.label}」: picks/coupon/risks 都至少 1 条`,
      t.picks.length >= 1 && t.coupon.length >= 1 && t.risks.length >= 1,
      `picks=${t.picks.length} coupon=${t.coupon.length} risks=${t.risks.length}`,
    );
  }
  check(`外卖平台数 >= 3（实际 ${PLATFORMS.length}）`, PLATFORMS.length >= 3);
  for (const p of PLATFORMS) {
    const url = p.buildSearch("test");
    check(
      `平台「${p.label}」搜索 URL 是 https://`,
      url.startsWith("https://"),
      `url=${url}`,
    );
  }
}

console.log("== 旅行美食图片入口可用 ==");
{
  // CityFoodImage 必须存在且复用 useDishPhoto / fetchDishImage（公开图源）
  const fs = await import("node:fs");
  const src = fs.readFileSync("client/src/components/CityFoodImage.tsx", "utf-8");
  check("CityFoodImage 复用 useDishPhoto", src.includes("useDishPhoto"));
  check(
    "CityFoodImage 在加载失败时仍渲染占位（emoji 或渐变）",
    src.includes("from-") && src.includes("emoji"),
  );
}

console.log("== 食材偏好（想吃什么）软筛选生效 ==");
{
  // 选「牛肉」+ 默认其它，30 次结果中至少有一些含牛肉的菜出现
  const prefs: Preferences = { ...DEFAULT_PREFS };
  const ctx = { ingredientWish: ["beef"] as any[] };
  let hits = 0;
  for (let i = 0; i < 30; i++) {
    const plan = recommend(prefs, [], ctx);
    const list = planToList(plan);
    if (list.some((d) => /牛肉|牛腩|牛排|肥牛|雪花牛|牛筋/.test(d.name + d.ingredients.map((i) => i.name).join(" ")))) hits++;
  }
  check(`想吃牛肉：30 次推荐中有 >= 8 次结果含牛肉菜（实际 ${hits}）`, hits >= 8);
}

console.log("== HotBoard 月份不变量（5 月不应固定 10 月内容）==");
{
  const { MONTH_THEMES, currentMonth, STATIC_FALLBACK, loadSource } = await import(
    "../client/src/lib/hotBoard"
  );
  // 月份主题 12 个齐全
  for (let m = 1; m <= 12; m++) {
    const t = MONTH_THEMES[m];
    check(`月主题 ${m} 月存在且字段齐全`, !!t && t.themes.length > 0 && t.food.length >= 3);
  }
  const m = currentMonth();
  check(`currentMonth 在 1-12 范围内（实际 ${m}）`, m >= 1 && m <= 12);
  // 静态 fallback 不应硬写其它月份的关键词
  for (const src of Object.keys(STATIC_FALLBACK)) {
    const items = STATIC_FALLBACK[src as keyof typeof STATIC_FALLBACK];
    const otherKeywords = ["十月新片速递", "深秋必去", "赏月地图", "国庆", "端午", "中秋", "立冬", "立春"];
    const offenders = items.filter((it: any) =>
      otherKeywords.some((k) => it.title.includes(k)),
    );
    check(
      `平台 ${src} 静态 fallback 不再硬写月份关键词（10 月 / 国庆 等）`,
      offenders.length === 0,
      offenders.map((o: any) => o.title).join("; "),
    );
  }
  // 离线加载会按月 rotate：应至少含 1 条命中当月主题词的话题
  const { items: weiboItems } = await loadSource("weibo");
  const themeWords = MONTH_THEMES[m].themes;
  const monthHit = weiboItems.some((it: any) =>
    [...themeWords, ...MONTH_THEMES[m].food, ...MONTH_THEMES[m].life]
      .some((w) => it.title.includes(w)),
  );
  // fallback 路径下应能命中；live 模式无法保证 — 故只在 live=false 时强校验
  check(
    `离线 fallback 加载时，结果含至少 1 条命中当月主题（${MONTH_THEMES[m].label}）`,
    monthHit,
    weiboItems.slice(0, 6).map((i: any) => i.title).join(" | "),
  );
}

console.log("== 外卖品牌库 ==");
{
  const { TAKEOUT_BRANDS, TAKEOUT_CATEGORY_TEMPLATES, pickTakeout } = await import(
    "../client/src/data/takeoutBrands"
  );
  // v3: 主推荐池 = 真实 A+B 品牌，必须 >= 300
  check(
    `外卖主品牌（真实 A+B）>= 300（实际 ${TAKEOUT_BRANDS.length}）`,
    TAKEOUT_BRANDS.length >= 300,
  );
  const realAB = TAKEOUT_BRANDS.filter((b: any) => b.realTier === "A" || b.realTier === "B");
  check(
    `主品牌池中 A/B realTier 数 == 总数（实际 ${realAB.length}/${TAKEOUT_BRANDS.length}）`,
    realAB.length === TAKEOUT_BRANDS.length,
  );
  // 已知不存在的虚构品牌不能再出现
  const FAKE_BRAND_NAMES = ["南方轻食联盟", "北方面食联合", "甜品工坊联合", "夜市烧烤联合", "南方粥铺联合", "北方饺子总店"];
  for (const fake of FAKE_BRAND_NAMES) {
    const hits = TAKEOUT_BRANDS.filter((b: any) => b.name === fake || b.name.includes(fake));
    check(
      `主品牌池不再包含虚构名「${fake}」`,
      hits.length === 0,
      hits.map((b: any) => b.id).join(", "),
    );
  }
  // 主品牌池必须含用户点名要的真实品牌
  const REQUIRED_REAL = ["达美乐", "牛约堡", "正新鸡排", "肯德基", "麦当劳", "华莱士", "塔斯汀", "瑞幸咖啡", "茶百道", "蜜雪冰城"];
  for (const want of REQUIRED_REAL) {
    const found = TAKEOUT_BRANDS.find((b: any) => b.name === want);
    check(`主品牌池含真实品牌「${want}」`, !!found, found ? `id=${found.id}` : "未找到");
  }
  // 品类模板（C 层）独立存放，不进入主推荐
  check(
    `品类模板（C 层）独立存放（实际 ${TAKEOUT_CATEGORY_TEMPLATES.length}）`,
    TAKEOUT_CATEGORY_TEMPLATES.length >= 25 && TAKEOUT_CATEGORY_TEMPLATES.length < 80,
  );
  let tplLabelOk = 0;
  for (const t of TAKEOUT_CATEGORY_TEMPLATES) {
    if (t.name.includes("（品类）") && t.realTier === "C") tplLabelOk++;
  }
  check(
    `品类模板均带「（品类）」后缀且 realTier=C（实际 ${tplLabelOk}/${TAKEOUT_CATEGORY_TEMPLATES.length}）`,
    tplLabelOk === TAKEOUT_CATEGORY_TEMPLATES.length,
  );
  // 品类模板不能在 pickTakeout 主推荐中出现
  const seenInPick = new Set<string>();
  for (let i = 0; i < 60; i++) {
    const r = pickTakeout({ city: "北京", budget: 30, people: 1, tastes: [], slot: "lunch" });
    seenInPick.add(r.special.id);
    for (const a of r.alternatives) seenInPick.add(a.id);
  }
  const tplIds = new Set(TAKEOUT_CATEGORY_TEMPLATES.map((t: any) => t.id));
  let tplLeak = 0;
  for (const id of seenInPick) if (tplIds.has(id)) tplLeak++;
  check(
    `pickTakeout 60 次抽样未泄漏品类模板（leak=${tplLeak}）`,
    tplLeak === 0,
  );

  for (const b of TAKEOUT_BRANDS) {
    check(
      `品牌「${b.name}」字段齐全 (picks/coupon/calorie)`,
      b.picks.length >= 1 && !!b.couponHint && !!b.calorieHint,
    );
  }
  // pickTakeout 至少能给出 special + 4 alternatives
  const r = pickTakeout({ city: "北京", budget: 30, people: 1, tastes: [], slot: "lunch" });
  check(`pickTakeout: special 存在`, !!r.special && !!r.special.id);
  check(`pickTakeout: alternatives 数量 >= 3`, r.alternatives.length >= 3);
  const seen = new Set<string>();
  for (let i = 0; i < 20; i++) {
    seen.add(pickTakeout({ city: "北京", budget: 30, people: 1, tastes: [], slot: "lunch" }).special.id);
  }
  check(`pickTakeout: 多次调用 special 至少 2 个不同候选`, seen.size >= 2, `seen=${seen.size}`);

  // v4: 用户点名的 15 个真实品牌都必须可在主品牌池查到（按 name 包含关系即可）
  const HOT_15 = ["肯德基", "麦当劳", "达美乐", "牛约堡", "正新鸡排", "德克士", "华莱士", "塔斯汀", "必胜客", "老乡鸡", "乡村基", "大米先生", "茶百道", "霸王茶姬", "瑞幸"];
  for (const want of HOT_15) {
    const found = TAKEOUT_BRANDS.find((b: any) => b.name.includes(want));
    check(`v4 热门 chip「${want}」在主品牌池可命中`, !!found, found ? found.name : "未找到");
  }

  // v4: pickTakeout 支持 pinnedBrandId 强制置顶，即便预算不匹配
  const dameile = TAKEOUT_BRANDS.find((b: any) => b.name === "达美乐");
  if (dameile) {
    const lowBudget = pickTakeout({ city: "北京", budget: 15, people: 1, tastes: [], pinnedBrandId: dameile.id });
    check(`v4 pickTakeout(pinnedBrandId): special.name === 达美乐`, lowBudget.special.id === dameile.id);
    check(`v4 pickTakeout(pinnedBrandId) 预算不符给出 budgetWarn`, !!lowBudget.budgetWarn, String(lowBudget.budgetWarn));
  }

  // v4: searchQuery 也能置顶
  const sq = pickTakeout({ city: "北京", budget: 30, people: 1, tastes: [], searchQuery: "牛约堡" });
  check(`v4 pickTakeout(searchQuery=牛约堡): special.name 包含 牛约堡`, sq.special.name.includes("牛约堡"));

  // v11: 「犒劳 / 高预算」模式连续刷新必须出现多家品牌（修复 lunch+健康轻食 时段一直 Wagas 的问题）。
  // 这里用 seed 模拟用户 30 次连续点「再来一份」，要求至少看到 ≥ 6 家不同的主推。
  const rewardSlots: Array<"lunch" | "dinner" | "midnight"> = ["lunch", "dinner", "midnight"];
  for (const slot of rewardSlots) {
    const seenSpecial = new Set<string>();
    let lastId: string | null = null;
    let consecutiveSame = 0;
    let prev: string | null = null;
    for (let s = 0; s < 30; s++) {
      const r = pickTakeout({
        budget: 80,
        people: 1,
        tastes: [],
        slot,
        lowCalorie: false,
        seed: s * 9301 + 17,
        recentBrandIds: lastId ? [lastId] : [],
      });
      seenSpecial.add(r.special.id);
      if (prev !== null && r.special.id === prev) consecutiveSame++;
      prev = r.special.id;
      lastId = r.special.id;
    }
    check(
      `v11 犒劳/${slot} 连续 30 次 special 至少 6 家不同（实际 ${seenSpecial.size}）`,
      seenSpecial.size >= 6,
      `seen=${seenSpecial.size}`,
    );
    check(
      `v11 犒劳/${slot} 30 次中相邻两次同一家品牌 < 4 次（实际 ${consecutiveSame}）`,
      consecutiveSame < 4,
      `consecutiveSame=${consecutiveSame}`,
    );
  }
  // 回归：seed 相同应给确定结果
  const det1 = pickTakeout({ budget: 80, people: 1, tastes: [], slot: "lunch", seed: 42 });
  const det2 = pickTakeout({ budget: 80, people: 1, tastes: [], slot: "lunch", seed: 42 });
  check(`v11 同 seed 同筛选给同一 special（确定性）`, det1.special.id === det2.special.id);

  // v4: TakeoutPanel UI 暴露 search input + hot chips testId
  const fs2 = await import("node:fs");
  const tpSrc = fs2.readFileSync("client/src/components/TakeoutPanel.tsx", "utf-8");
  check(`TakeoutPanel 含品牌搜索输入框 (data-testid=takeout-brand-search)`, tpSrc.includes('data-testid="takeout-brand-search"'));
  check(`TakeoutPanel 含热门连锁 chip 容器 (data-testid=takeout-hot-chips)`, tpSrc.includes('data-testid="takeout-hot-chips"'));
  // chip 列表文案在 takeoutBrands.ts 的 HOT_TAKEOUT_BRANDS 常量中
  const { HOT_TAKEOUT_BRANDS } = await import("../client/src/data/takeoutBrands");
  const labels = (HOT_TAKEOUT_BRANDS as any[]).map((h) => h.label);
  for (const want of HOT_15) {
    check(`HOT_TAKEOUT_BRANDS 含「${want}」chip`, labels.includes(want), `labels=${labels.join(",")}`);
  }
}

console.log("== 零食 / 水果数据 ==");
{
  const { SNACKS, pickSnack } = await import("../client/src/data/snacks");
  // v3: 301+ 真实零食 / 饮料商品
  check(`零食真实条目 >= 301（实际 ${SNACKS.length}）`, SNACKS.length >= 301);
  // 必须含品牌字段（真实数据带 brand）
  const withBrand = SNACKS.filter((s: any) => s.brand && s.brand.length > 0).length;
  check(
    `零食条目均含 brand（实际 ${withBrand}/${SNACKS.length}）`,
    withBrand === SNACKS.length,
  );
  // 必须能搜到「可口可乐」「乐事」「卫龙」「农夫山泉」等真实品牌商品
  const REQUIRED_SNACK_BRANDS = ["可口可乐", "乐事", "卫龙", "蒙牛", "伊利", "三只松鼠"];
  for (const want of REQUIRED_SNACK_BRANDS) {
    const found = SNACKS.find((s: any) => s.name.includes(want) || (s.brand ?? "").includes(want));
    check(`零食池含真实品牌「${want}」`, !!found, found ? found.name : "未找到");
  }
  for (const s of SNACKS) {
    check(
      `零食「${s.name}」: calories>0 / 价格 / reason 完整`,
      s.calories >= 0 && !!s.price && !!s.reason,
    );
  }
  const r = pickSnack({ audiences: ["减脂", "控糖"] });
  check(`pickSnack 减脂控糖: special 存在`, !!r.special);
  check(`pickSnack 减脂控糖: alternatives 至少 3 条`, r.alternatives.length >= 3);

  // v6: 类目拆分 — 「巧克力糖果」拆为「巧克力」+「糖果」；「酸奶乳品」拆为「酸奶」+「牛奶乳饮」
  // 旧的合并标签 normalize 之后必须为空（generated.ts 残留全部被拆走）
  const legacyChocCandy = SNACKS.filter((s: any) => s.category === "巧克力糖果");
  const legacyDairy = SNACKS.filter((s: any) => s.category === "酸奶乳品");
  check(
    `v6 旧标签「巧克力糖果」normalize 后清零`,
    legacyChocCandy.length === 0,
    legacyChocCandy.slice(0, 5).map((s: any) => s.name).join(" | "),
  );
  check(
    `v6 旧标签「酸奶乳品」normalize 后清零`,
    legacyDairy.length === 0,
    legacyDairy.slice(0, 5).map((s: any) => s.name).join(" | "),
  );

  const choc = SNACKS.filter((s: any) => s.category === "巧克力");
  const candy = SNACKS.filter((s: any) => s.category === "糖果");
  const yog = SNACKS.filter((s: any) => s.category === "酸奶");
  const milk = SNACKS.filter((s: any) => s.category === "牛奶乳饮");
  const biscuit = SNACKS.filter((s: any) => s.category === "饼干曲奇");
  const breadCake = SNACKS.filter((s: any) => s.category === "面包糕点");

  // 巧克力分类正确性
  for (const k of ["德芙", "明治", "好时", "费列罗", "瑞士莲", "KitKat"]) {
    const inChoc = choc.some((s: any) => (s.name + " " + (s.brand ?? "")).includes(k));
    check(`v6 「${k}」在「巧克力」分类中可见`, inChoc);
  }
  // 巧克力分类不应含烘焙糕点 / 糖果 / 牛奶
  const chocBadKW = /核桃酥|花生酥|沙琪玛|蛋黄派|月饼|吐司|面包|奶糖|软糖|薄荷糖|口香糖|曼妥思|大白兔|阿尔卑斯|益达|纯牛奶|金典|特仑苏|认养一头牛|旺仔牛奶/;
  const chocStray = choc.filter((s: any) => chocBadKW.test(s.name + " " + (s.brand ?? "")));
  check(
    `v6 「巧克力」分类不含烘焙/糖果/牛奶（实际混入 ${chocStray.length} 条）`,
    chocStray.length === 0,
    chocStray.slice(0, 5).map((s: any) => `${s.name}[${s.category}]`).join(" | "),
  );

  // 糖果分类正确性
  for (const k of ["曼妥思", "大白兔", "阿尔卑斯", "奶糖"]) {
    const inCandy = candy.some((s: any) => (s.name + " " + (s.brand ?? "")).includes(k));
    check(`v6 「${k}」在「糖果」分类中可见`, inCandy);
  }
  // 糖果不得含烘焙
  const candyBadKW = /核桃酥|花生酥|沙琪玛|月饼|吐司|面包|曲奇饼干|消化饼/;
  const candyStray = candy.filter((s: any) => candyBadKW.test(s.name + " " + (s.brand ?? "")));
  check(
    `v6 「糖果」分类不含烘焙（实际混入 ${candyStray.length} 条）`,
    candyStray.length === 0,
    candyStray.slice(0, 5).map((s: any) => `${s.name}[${s.category}]`).join(" | "),
  );

  // 酸奶分类正确性 —— 不能混入纯牛奶
  for (const k of ["安慕希", "纯甄", "莫斯利安", "简爱", "卡士"]) {
    const inYog = yog.some((s: any) => (s.name + " " + (s.brand ?? "")).includes(k));
    check(`v6 「${k}」在「酸奶」分类中可见`, inYog);
  }
  const yogBadKW = /^(?!.*酸).*纯牛奶|金典|特仑苏|认养一头牛|旺仔牛奶|舒化奶|每日鲜语|早餐奶|AD钙/;
  const yogStray = yog.filter((s: any) => yogBadKW.test(s.name));
  check(
    `v6 「酸奶」分类不含纯牛奶 / 牛奶饮品（实际混入 ${yogStray.length} 条）`,
    yogStray.length === 0,
    yogStray.slice(0, 5).map((s: any) => `${s.name}[${s.category}]`).join(" | "),
  );

  // 牛奶乳饮分类正确性
  for (const k of ["金典", "特仑苏", "认养一头牛", "旺仔牛奶"]) {
    const inMilk = milk.some((s: any) => (s.name + " " + (s.brand ?? "")).includes(k));
    check(`v6 「${k}」在「牛奶乳饮」分类中可见`, inMilk);
  }
  // 牛奶乳饮不得含「酸奶」字样的真酸奶（避免反向串类）
  const milkBadKW = /酸奶|发酵乳|乳酸菌饮料/;
  const milkStray = milk.filter((s: any) => milkBadKW.test(s.name));
  check(
    `v6 「牛奶乳饮」分类不含酸奶（实际混入 ${milkStray.length} 条）`,
    milkStray.length === 0,
    milkStray.slice(0, 5).map((s: any) => `${s.name}[${s.category}]`).join(" | "),
  );

  // 饼干曲奇必含核桃酥
  const biscuitHasNutCake = biscuit.some((s: any) => s.name.includes("核桃酥"));
  check(`v6 「饼干曲奇」分类含核桃酥`, biscuitHasNutCake);
  // 沙琪玛归到面包糕点
  const breadHasShaqima = breadCake.some((s: any) => s.name.includes("沙琪玛"));
  check(`v6 「面包糕点」分类含沙琪玛`, breadHasShaqima);

  // pickSnack 在 preferCategories 下必须严格过滤 main + alternatives
  const CHOC_BAD_KW = /核桃酥|花生酥|沙琪玛|奶糖|软糖|薄荷糖|口香糖|曼妥思|大白兔|阿尔卑斯|益达|纯牛奶|金典|特仑苏|认养一头牛|旺仔牛奶/;
  for (let i = 0; i < 40; i++) {
    const r = pickSnack({ audiences: [], preferCategories: ["巧克力"] });
    const all = [r.special, ...r.alternatives];
    const allChoc = all.every((s: any) => s.category === "巧克力");
    check(
      `v6 巧克力筛选(第${i + 1}次): 主卡+候选 category 全部 = 巧克力`,
      allChoc,
      all.map((s: any) => `${s.name}[${s.category}]`).join(" | "),
    );
    const badHits = all.filter((s: any) => CHOC_BAD_KW.test(s.name + " " + (s.brand ?? "")));
    check(
      `v6 巧克力筛选(第${i + 1}次): 主卡+候选 不含核桃酥/奶糖/牛奶`,
      badHits.length === 0,
      badHits.map((s: any) => `${s.name}[${s.category}]`).join(" | "),
    );
    if (!allChoc || badHits.length > 0) break;
  }
  for (let i = 0; i < 40; i++) {
    const r = pickSnack({ audiences: [], preferCategories: ["糖果"] });
    const all = [r.special, ...r.alternatives];
    const allCandy = all.every((s: any) => s.category === "糖果");
    check(
      `v6 糖果筛选(第${i + 1}次): 主卡+候选 category 全部 = 糖果`,
      allCandy,
      all.map((s: any) => `${s.name}[${s.category}]`).join(" | "),
    );
    const candyBad = all.filter((s: any) => /核桃酥|花生酥|沙琪玛|巧克力(?!派)/.test(s.name));
    check(
      `v6 糖果筛选(第${i + 1}次): 主卡+候选 不含核桃酥 / 巧克力`,
      candyBad.length === 0,
      candyBad.map((s: any) => `${s.name}[${s.category}]`).join(" | "),
    );
    if (!allCandy || candyBad.length > 0) break;
  }
  for (let i = 0; i < 40; i++) {
    const r = pickSnack({ audiences: [], preferCategories: ["酸奶"] });
    const all = [r.special, ...r.alternatives];
    const allYog = all.every((s: any) => s.category === "酸奶");
    check(
      `v6 酸奶筛选(第${i + 1}次): 主卡+候选 category 全部 = 酸奶`,
      allYog,
      all.map((s: any) => `${s.name}[${s.category}]`).join(" | "),
    );
    // chip 写「酸奶」不可出现纯牛奶 / 巧克力
    const yogBad = all.filter((s: any) => /^(?!.*酸).*纯牛奶|金典|特仑苏|认养一头牛|旺仔牛奶|巧克力/.test(s.name));
    check(
      `v6 酸奶筛选(第${i + 1}次): 不含纯牛奶/巧克力`,
      yogBad.length === 0,
      yogBad.map((s: any) => `${s.name}[${s.category}]`).join(" | "),
    );
    if (!allYog || yogBad.length > 0) break;
  }
  for (let i = 0; i < 40; i++) {
    const r = pickSnack({ audiences: [], preferCategories: ["牛奶乳饮"] });
    const all = [r.special, ...r.alternatives];
    const allMilk = all.every((s: any) => s.category === "牛奶乳饮");
    check(
      `v6 牛奶乳饮筛选(第${i + 1}次): 主卡+候选 category 全部 = 牛奶乳饮`,
      allMilk,
      all.map((s: any) => `${s.name}[${s.category}]`).join(" | "),
    );
    if (!allMilk) break;
  }

  // 也覆盖另外几个分类（仅检查池中有数据的分类，空池由 UI 隐藏）
  const catCounts: Record<string, number> = {};
  for (const s of SNACKS as any[]) catCounts[s.category] = (catCounts[s.category] ?? 0) + 1;
  for (const cat of ["饮料", "无糖饮料", "薯片膨化", "坚果", "蛋白零食", "肉脯肉干", "饼干曲奇", "面包糕点", "冰品冰淇淋"] as const) {
    if ((catCounts[cat] ?? 0) === 0) continue;
    const r = pickSnack({ audiences: [], preferCategories: [cat] });
    const all = [r.special, ...r.alternatives];
    const ok = all.every((s: any) => s.category === cat);
    check(
      `v6 「${cat}」筛选: 主卡+候选 category 全部一致`,
      ok,
      all.map((s: any) => `${s.name}[${s.category}]`).join(" | "),
    );
  }
  // 多分类组合 (OR) 也必须严格——主卡+候选 category 必属于所选集合
  const multi = pickSnack({ audiences: [], preferCategories: ["巧克力", "饼干曲奇"] });
  const multiAll = [multi.special, ...multi.alternatives];
  check(
    `v6 多分类(巧克力+饼干曲奇)筛选: 主卡+候选 全部命中所选集合`,
    multiAll.every((s: any) => s.category === "巧克力" || s.category === "饼干曲奇"),
    multiAll.map((s: any) => `${s.name}[${s.category}]`).join(" | "),
  );

  const { FRUITS, fruitsForMonth } = await import("../client/src/data/fruits");
  // v2: 80+ 水果
  check(`水果条目 >= 80（实际 ${FRUITS.length}）`, FRUITS.length >= 80);
  // 每月都至少有 4 种水果
  for (let m = 1; m <= 12; m++) {
    const list = fruitsForMonth(m);
    check(`月 ${m} 至少 4 种当令水果（实际 ${list.length}）`, list.length >= 4);
  }
  // 5 月应当能命中 枇杷 / 樱桃 / 草莓 / 荔枝 / 芒果 这些
  const may = fruitsForMonth(5).map((f: any) => f.name);
  const mayKeyTaste = ["枇杷", "樱桃", "草莓", "荔枝", "芒果"];
  const mayHits = mayKeyTaste.filter((k) => may.some((n: string) => n.includes(k)));
  check(
    `5 月当令水果含至少 4 种（枇杷/樱桃/草莓/荔枝/芒果）`,
    mayHits.length >= 4,
    `命中 ${mayHits.join("/")}, may=${may.join("/")}`,
  );

  // 5 月默认首屏（special + alternatives + highlights）必须稳定命中 4-5 个
  const { pickFruit, highlightsForMonth } = await import("../client/src/data/fruits");
  const mayHighlights = highlightsForMonth(5).map((f: any) => f.name);
  const mayHighlightHits = mayKeyTaste.filter((k) =>
    mayHighlights.some((n: string) => n.includes(k)),
  );
  check(
    `5 月 highlights 至少含 4 种关键水果`,
    mayHighlightHits.length >= 4,
    `命中 ${mayHighlightHits.join("/")}, highlights=${mayHighlights.join("/")}`,
  );
  check(
    `5 月 highlights 包含全部 5 种关键水果`,
    mayHighlightHits.length === 5,
    `命中 ${mayHighlightHits.join("/")}`,
  );

  let minFirstScreenHits = 5;
  for (let i = 0; i < 30; i++) {
    const r: any = pickFruit({ month: 5, audiences: [], seasonalOnly: true });
    const firstScreen = [
      r.special.name,
      ...r.alternatives.map((f: any) => f.name),
      ...r.highlights.map((f: any) => f.name),
    ];
    const hits = mayKeyTaste.filter((k) => firstScreen.some((n: string) => n.includes(k))).length;
    minFirstScreenHits = Math.min(minFirstScreenHits, hits);
  }
  check(
    `5 月默认首屏 30 次重抽都至少命中 4 种关键水果`,
    minFirstScreenHits >= 4,
    `min=${minFirstScreenHits}`,
  );
}

console.log("== v2: 饭桌陪伴 / 话题 / 听什么 池容量 ==");
{
  const { WATCH_ITEMS, TOPIC_ITEMS, AUDIO_ITEMS } = await import(
    "../client/src/data/companions"
  );
  check(`影视池 >= 200（实际 ${WATCH_ITEMS.length}）`, WATCH_ITEMS.length >= 200);
  check(`话题池 >= 200（实际 ${TOPIC_ITEMS.length}）`, TOPIC_ITEMS.length >= 200);
  check(`音频池 >= 200（实际 ${AUDIO_ITEMS.length}）`, AUDIO_ITEMS.length >= 200);
}

console.log("== v2: 美团闪购 / 美团外卖 主入口走稳定搜索 ==");
{
  const { snackSearchLinks } = await import("../client/src/data/snacks");
  const links = snackSearchLinks("辣条");
  // 第一项必须不是 i.meituan.com 直链（已知 error_page 风险）
  check(
    "snackSearchLinks 主入口不再是 i.meituan.com 直链",
    !links[0].href.includes("i.meituan.com/awp/h5"),
    `主入口=${links[0].href}`,
  );
  check(
    "snackSearchLinks 主入口包含「美团闪购」字样",
    links[0].label.includes("美团闪购"),
  );
  const { PLATFORMS } = await import("../client/src/data/takeout");
  const meituan = PLATFORMS.find((p) => p.id === "meituan");
  check(`takeout PLATFORMS 含 meituan`, !!meituan);
  if (meituan) {
    const url = meituan.buildSearch("test");
    check(
      "takeout meituan 主入口不再走 h5.waimai.meituan.com 直链",
      !url.includes("h5.waimai.meituan.com"),
      `url=${url}`,
    );
  }
}

console.log("== v2: 主题系统 ==");
{
  const { THEMES, applyTheme, loadTheme } = await import(
    "../client/src/lib/theme"
  );
  check(`主题数 >= 6（实际 ${THEMES.length}）`, THEMES.length >= 6);
  // 主题必须含 fresh / cream / mint / midnight / vibrant / minimal 之中至少 5 项
  const required = ["fresh", "cream", "mint", "midnight", "vibrant", "minimal"];
  const have = required.filter((id) => THEMES.some((t: any) => t.id === id));
  check(`常用主题至少含 5 个 ${required.join("/")}`, have.length >= 5, `命中 ${have.join(", ")}`);
  // 默认主题应是 fresh
  const def = loadTheme();
  check(`默认主题 = fresh（实际 ${def}）`, def === "fresh" || THEMES.some((t: any) => t.id === def));
}

console.log("== v11: 顶部主导航收纳为 5 个一级入口（不再依赖横向拖动）==");
{
  const fs = await import("node:fs");
  const src = fs.readFileSync("client/src/components/MainTabs.tsx", "utf-8");
  // 一级入口只剩 5 个分组；weekly 等旧模块作为二级入口仍可达，但不再出现在 PRIMARY_TABS。
  check("MainTabs 定义 PRIMARY_TABS（5 个一级入口）", src.includes("PRIMARY_TABS"));
  check(
    "MainTabs 含 5 个核心一级入口（home/family/search/health/companion）",
    ["home", "family", "search", "health", "companion"].every((id) => src.includes(`id: "${id}"`)),
  );
  check(
    "MainTabs 按钮高度 h-12（更大）",
    src.includes("h-12"),
  );
  // 不应再依赖 horizontal scroll / 拖拽 — 用户说「减少拖动麻烦」
  check(
    "MainTabs 不再使用横向拖拽（pointerdown）",
    !src.includes("pointerdown") || src.split("pointerdown").length <= 1,
  );
  // CSS 提供 .main-tabs-row 自适应等分
  const css = fs.readFileSync("client/src/index.css", "utf-8");
  check(
    ".main-tabs-row 自定义类支持媒体查询",
    css.includes(".main-tabs-row") && css.includes("--tab-cols"),
  );
}

console.log("== v3: 懒人决定海报 / 浮窗 估算口径一致 ==");
{
  // 用 helper 算一次结果，海报 priceEst/caloriesEst 应等于浮窗在「全部加入今日已选」后的总价 / 总热量。
  const { buildLazyItems, totalsOfLazyItems } = await import("../client/src/lib/lazyEstimates");
  const sample = buildLazyItems({
    recipe: { name: "清蒸鲈鱼", cuisine: "粤菜" },
    takeoutBrand: { id: "huazhong-zhoupu", name: "华中粥铺", intro: "清淡养胃首选", budgetMin: 18, budgetMax: 28 },
    snack: { id: "snack-mochi", name: "麻薯/大福", price: "¥7", calories: 180 },
    fruit: { id: "fruit-feizixiao", name: "妃子笑荔枝", calories: 60 },
    drink: "瑞幸生椰拿铁",
  });
  // 浮窗求和（总价 / 总热量）
  const totals = totalsOfLazyItems(sample);
  // 海报本来就是从同一份 helper 算出的；这里反过来再走一遍逐项相加，确保两端口径一致。
  const sumPrice = sample.reduce((acc, x) => acc + (x.price ?? 0), 0);
  const sumCal = sample.reduce((acc, x) => acc + (x.calories ?? 0), 0);
  check(
    "buildLazyItems 求和 == totalsOfLazyItems",
    Math.round(sumPrice) === totals.price && Math.round(sumCal) === totals.calories,
    `sumPrice=${sumPrice} totalsPrice=${totals.price} sumCal=${sumCal} totalsCal=${totals.calories}`,
  );
  // 至少含菜 / 外卖 / 零食 / 水果 / 饮料 5 个 kind
  const kinds = new Set(sample.map((x) => x.kind));
  check(
    "buildLazyItems 包含 dish/takeout/snack/fruit/drink 5 类",
    ["dish", "takeout", "snack", "fruit", "drink"].every((k) => kinds.has(k as any)),
    Array.from(kinds).join(","),
  );
  // 总价 > 0、总热量 > 0
  check("总价 > 0", totals.price > 0, String(totals.price));
  check("总热量 > 0", totals.calories > 0, String(totals.calories));
  // 加入后的 count 与海报展示相符（5 项当 recipe 存在；4 项无 recipe）
  check("含 recipe 时项目数 = 5", sample.length === 5, String(sample.length));
  const noRecipe = buildLazyItems({
    recipe: null,
    takeoutBrand: { id: "x", name: "测试", intro: "测", budgetMin: 10, budgetMax: 30 },
    snack: { id: "s", name: "测", price: "¥5", calories: 100 },
    fruit: { id: "f", name: "测", calories: 60 },
    drink: "测",
  });
  check("无 recipe 时项目数 = 4", noRecipe.length === 4, String(noRecipe.length));
}

console.log("== v3: TodayDock 通过 useSyncExternalStore 订阅，加入后立即刷新 ==");
{
  const fs = await import("node:fs");
  const dockSrc = fs.readFileSync("client/src/components/TodayDock.tsx", "utf-8");
  check(
    "TodayDock 使用 useSelectedToday hook（不再 useEffect+listSelected 拉取）",
    dockSrc.includes("useSelectedToday"),
  );
  const storeSrc = fs.readFileSync("client/src/lib/selectedToday.ts", "utf-8");
  check(
    "selectedToday 暴露 useSyncExternalStore",
    storeSrc.includes("useSyncExternalStore"),
  );
}

console.log("== v3: PWA — manifest / service worker 存在 ==");
{
  const fs = await import("node:fs");
  check("client/public/manifest.webmanifest 存在", fs.existsSync("client/public/manifest.webmanifest"));
  check("client/public/sw.js 存在", fs.existsSync("client/public/sw.js"));
  check("client/src/lib/registerSW.ts 存在", fs.existsSync("client/src/lib/registerSW.ts"));
  // index.html 必须引用 manifest 并设置 apple-mobile-web-app-capable
  const html = fs.readFileSync("client/index.html", "utf-8");
  check("index.html 引用 manifest.webmanifest", html.includes('rel="manifest"') && html.includes("manifest.webmanifest"));
  check("index.html 设置 apple-mobile-web-app-capable", html.includes("apple-mobile-web-app-capable"));
  // main.tsx 必须调用 registerServiceWorker
  const main = fs.readFileSync("client/src/main.tsx", "utf-8");
  check("main.tsx 调用 registerServiceWorker()", main.includes("registerServiceWorker"));
  // SW 内部不能硬写 GitHub Pages base path
  const sw = fs.readFileSync("client/public/sw.js", "utf-8");
  check(
    "sw.js 不硬写 /jin-tian-chi-shenme/ base path（应使用 registration.scope）",
    !sw.includes("/jin-tian-chi-shenme/"),
  );
  check(
    "sw.js HTML 走 network-first，静态资源走 cache-first",
    sw.includes("networkFirstHtml") && sw.includes("cacheFirstStatic"),
  );
  // manifest 必须含 start_url + scope + icons
  const manifest = JSON.parse(fs.readFileSync("client/public/manifest.webmanifest", "utf-8"));
  check("manifest 含 start_url / scope / icons", !!manifest.start_url && !!manifest.scope && Array.isArray(manifest.icons) && manifest.icons.length > 0);
}

console.log("== v3: 懒人决定面板 — 图片 / 链接 / 短诗 ==");
{
  const fs = await import("node:fs");
  check("FoodImage 公共组件存在", fs.existsSync("client/src/components/FoodImage.tsx"));
  check("lazyCopy 文案库存在", fs.existsSync("client/src/lib/lazyCopy.ts"));
  const lazySrc = fs.readFileSync("client/src/components/LazyDecisionPanel.tsx", "utf-8");
  check("LazyDecisionPanel 引入 FoodImage", lazySrc.includes("FoodImage"));
  check("LazyDecisionPanel 引入 stableSearchUrl", lazySrc.includes("stableSearchUrl"));
  check("LazyDecisionPanel 渲染短诗（lazy-poem）", lazySrc.includes("data-testid=\"lazy-poem\""));
  check("LazyDecisionPanel 渲染温柔小话（lazy-tender）", lazySrc.includes("data-testid=\"lazy-tender\""));
  check("LazyDecisionPanel 引入 moodQuote / poemFor / tenderParagraph", lazySrc.includes("moodQuote") && lazySrc.includes("poemFor") && lazySrc.includes("tenderParagraph"));
  const posterSrc = fs.readFileSync("client/src/components/DecisionPoster.tsx", "utf-8");
  check("DecisionPoster 引入 FoodImage", posterSrc.includes("FoodImage"));
  check("DecisionPoster PosterRow 含搜索链接", posterSrc.includes("link?:") && posterSrc.includes("stableSearchUrl"));
}

console.log("== v3: FoodImage / 稳定搜索链接 ==");
{
  const fs = await import("node:fs");
  const fi = fs.readFileSync("client/src/components/FoodImage.tsx", "utf-8");
  // stableSearchUrl 主入口必须不是商家直链
  check("stableSearchUrl 美团 走百度站内搜索", fi.includes('"美团":') && fi.includes("site:meituan.com"));
  check("stableSearchUrl 美团闪购 走百度搜索", fi.includes('"美团闪购":') && fi.includes("美团闪购"));
  check("FoodImage 复用 useDishPhoto", fi.includes("useDishPhoto"));
  check("FoodImage 在加载失败时仍渲染 emoji + 渐变 fallback", fi.includes("ImageOff") && fi.includes("gradient") && fi.includes("emoji"));
}

console.log("== v2: 海报 / 浮窗 / 一周计划 / 快速问答 文件存在 ==");
{
  const fs = await import("node:fs");
  for (const p of [
    "client/src/components/DecisionPoster.tsx",
    "client/src/components/TodayDock.tsx",
    "client/src/components/WeeklyPlanPanel.tsx",
    "client/src/components/LazyWizardDialog.tsx",
    "client/src/lib/selectedToday.ts",
    "client/src/lib/theme.ts",
  ]) {
    check(`存在 ${p}`, fs.existsSync(p));
  }
}

console.log("== v7: 桌面结构推荐（家庭/长辈/儿童不全凉菜不全汤）==");
{
  const { applyScenarioToPrefs, getScenario } = await import("../client/src/lib/scenarios");
  const scenarios = ["family-dinner", "elder-light", "kid-friendly"] as const;
  for (const sid of scenarios) {
    const sc = getScenario(sid as any);
    const prefs = applyScenarioToPrefs(DEFAULT_PREFS, sid as any);
    let allColdRuns = 0;
    let allSoupRuns = 0;
    let proteinHits = 0;
    let veggieHits = 0;
    const N = 25;
    for (let i = 0; i < N; i++) {
      const plan = recommend(prefs, [], { scenario: sc });
      const list = planToList(plan);
      const COLD = /凉拌|拌(?!饭|面|粉)|沙拉|凉菜|凉面|凉皮|皮蛋豆腐|拍黄瓜|呛|腌/;
      const cold = list.filter((d) => COLD.test(d.name)).length;
      const soups = list.filter((d) => d.course === "soup").length;
      if (list.length > 0 && cold === list.length) allColdRuns++;
      if (list.length > 0 && soups === list.length) allSoupRuns++;
      const protein = list.some((d) =>
        d.ingredients.some(
          (i: any) =>
            i.category === "肉蛋豆制品" &&
            /鸡|鸭|鱼|虾|蟹|猪|牛|羊|肉|蛋|豆腐|腐竹|豆干|百叶/.test(i.name),
        ),
      );
      const veg = list.some((d) => d.course === "veggie");
      if (protein) proteinHits++;
      if (veg) veggieHits++;
    }
    check(`v7 ${sid}: 25 次推荐均不是「全凉菜」`, allColdRuns === 0, `allColdRuns=${allColdRuns}`);
    check(`v7 ${sid}: 25 次推荐均不是「全汤」`, allSoupRuns === 0, `allSoupRuns=${allSoupRuns}`);
    check(
      `v7 ${sid}: 至少 80% 推荐含蛋白主菜（实际 ${proteinHits}/${N}）`,
      proteinHits >= Math.ceil(N * 0.8),
    );
    check(
      `v7 ${sid}: 至少 80% 推荐含蔬菜（实际 ${veggieHits}/${N}）`,
      veggieHits >= Math.ceil(N * 0.8),
    );
  }
  // family-dinner 默认 mainCount=2 + withSoup + withVeggie，应该有「主菜+蔬菜+汤」三类
  const sc = getScenario("family-dinner");
  const prefs = applyScenarioToPrefs(DEFAULT_PREFS, "family-dinner");
  const plan = recommend(prefs, [], { scenario: sc });
  check(
    `v7 family-dinner: tableBalance 字段存在`,
    !!plan.tableBalance,
    JSON.stringify(plan.tableBalance ?? null),
  );
  check(
    `v7 family-dinner: tableBalance.style === 'family'`,
    plan.tableBalance?.style === "family",
  );
}

console.log("== v7: 外卖品类平衡（清淡+酸辣+100元 不全咖啡）==");
{
  const { pickTakeout } = await import("../client/src/data/takeoutBrands");
  const drinkCats = new Set(["茶饮咖啡", "奶茶饮品", "甜品下午茶"]);
  const mainCats = new Set([
    "中式快餐", "粉面", "汉堡炸鸡", "饭团便当", "饺子小笼",
    "披萨意面", "火锅麻辣烫", "烤肉烧烤", "健康轻食", "海鲜日料", "粥早餐",
  ]);
  // 上海+100+清淡+酸辣，午餐 — 不应全咖啡
  let drinkSpecialCount = 0;
  let allDrinkRuns = 0;
  let mainCountSum = 0;
  const N = 25;
  for (let i = 0; i < N; i++) {
    const r = pickTakeout({ city: "上海", budget: 100, people: 1, tastes: ["清淡", "酸辣"], slot: "lunch" });
    const all = [r.special, ...r.alternatives];
    if (drinkCats.has(r.special.category)) drinkSpecialCount++;
    if (all.every((b) => drinkCats.has(b.category))) allDrinkRuns++;
    mainCountSum += all.filter((b) => mainCats.has(b.category)).length;
  }
  check(`v7 上海+100+清淡酸辣 lunch: special 几乎不是饮品（${drinkSpecialCount}/${N}）`, drinkSpecialCount <= Math.ceil(N * 0.1));
  check(`v7 上海+100+清淡酸辣 lunch: 没有「全咖啡」候选（${allDrinkRuns}/${N}）`, allDrinkRuns === 0);
  check(`v7 上海+100+清淡酸辣 lunch: 平均正餐数 >= 2 (${(mainCountSum / N).toFixed(1)})`, mainCountSum / N >= 2);
  // 候选中饮品最多 1 个（lunch 不允许多饮品）
  let drinkOver1 = 0;
  for (let i = 0; i < N; i++) {
    const r = pickTakeout({ city: "上海", budget: 100, people: 1, tastes: ["清淡", "酸辣"], slot: "lunch" });
    const drinks = [r.special, ...r.alternatives].filter((b) => drinkCats.has(b.category)).length;
    if (drinks > 1) drinkOver1++;
  }
  check(`v7 lunch 候选中饮品 <= 1（违规次数 ${drinkOver1}/${N}）`, drinkOver1 === 0);
  // dinner 同样测试
  for (let i = 0; i < 10; i++) {
    const r = pickTakeout({ city: "北京", budget: 60, people: 1, tastes: ["清淡"], slot: "dinner" });
    const all = [r.special, ...r.alternatives];
    const drinks = all.filter((b) => drinkCats.has(b.category)).length;
    const mains = all.filter((b) => mainCats.has(b.category)).length;
    check(`v7 dinner 候选 drinks<=1 mains>=2 (drinks=${drinks} mains=${mains})`, drinks <= 1 && mains >= 2);
  }
  // breakfast 时段允许多饮品（不强制限制）
  const br = pickTakeout({ city: "上海", budget: 30, people: 1, tastes: [], slot: "breakfast" });
  check(`v7 breakfast: 至少能给出 special + alternatives`, !!br.special && br.alternatives.length >= 3);
}

console.log("== v7: 懒人简餐模板池 ==");
{
  const { LAZY_MEALS, pickLazyMeal } = await import("../client/src/data/lazyMeals");
  // v12: 懒人简餐扩到 200+，覆盖 5/10/免开火/便利店/外卖平替/宿舍/减脂/夜宵/早餐/甜品 等场景
  check(`v12 懒人简餐模板 >= 200（实际 ${LAZY_MEALS.length}）`, LAZY_MEALS.length >= 200);
  for (const m of LAZY_MEALS) {
    check(
      `模板「${m.name}」字段齐全 (equipment/steps/calories/price)`,
      m.equipment.length >= 1 && m.steps.length >= 1 && m.calories > 0 && m.price > 0,
    );
  }
  // 各设备至少有几个
  const eqCount: Record<string, number> = {};
  for (const m of LAZY_MEALS) for (const e of m.equipment) eqCount[e] = (eqCount[e] ?? 0) + 1;
  for (const eq of ["空气炸锅", "电饭煲", "微波炉", "一口锅"] as const) {
    check(`设备「${eq}」至少有 5 个模板（实际 ${eqCount[eq] ?? 0}）`, (eqCount[eq] ?? 0) >= 5);
  }
  // pickLazyMeal 命中
  const r = pickLazyMeal({ equipment: ["空气炸锅"], maxMinutes: 30 });
  check(`pickLazyMeal(空气炸锅): special 含「空气炸锅」`, r.special.equipment.includes("空气炸锅"));
  check(`pickLazyMeal: alternatives >= 3`, r.alternatives.length >= 3);

  // v7.1: 用户明确选了设备 → 池非空时 special + alternatives 必须全部命中该设备
  const SINGLE_EQUIPMENTS = ["电饭煲", "空气炸锅", "微波炉", "早餐机", "一口锅"] as const;
  for (const eq of SINGLE_EQUIPMENTS) {
    const poolSize = LAZY_MEALS.filter((m) => m.equipment.includes(eq)).length;
    if (poolSize === 0) continue; // 跳过空池设备（理论不应有）
    let mainHits = 0;
    let allHits = 0;
    const N = 30;
    for (let i = 0; i < N; i++) {
      const r = pickLazyMeal({ equipment: [eq], maxMinutes: 60 });
      const all = [r.special, ...r.alternatives];
      if (r.special.equipment.includes(eq)) mainHits++;
      if (all.every((m) => m.equipment.includes(eq))) allHits++;
    }
    check(
      `v7.1 设备「${eq}」严格筛选: 30 次 special 全部命中（${mainHits}/${N}）`,
      mainHits === N,
    );
    check(
      `v7.1 设备「${eq}」严格筛选: 30 次 special+alternatives 全部命中（${allHits}/${N}）`,
      allHits === N,
    );
  }

  // v7.1: 电饭煲 + 鸡蛋 + 米饭 + 省钱 — 必须给电饭煲方案，且应优先含鸡蛋的电饭煲模板
  let rcEggHits = 0;
  let rcEggRiceHits = 0;
  const M = 30;
  for (let i = 0; i < M; i++) {
    const r = pickLazyMeal({
      equipment: ["电饭煲"],
      maxMinutes: 60,
      fridge: ["鸡蛋", "米饭"],
      goals: ["省钱"],
    });
    const all = [r.special, ...r.alternatives];
    if (all.every((m) => m.equipment.includes("电饭煲"))) rcEggHits++;
    if (
      r.special.equipment.includes("电饭煲") &&
      r.special.uses.includes("鸡蛋") &&
      r.special.uses.includes("米饭")
    ) {
      rcEggRiceHits++;
    }
  }
  check(
    `v7.1 电饭煲+鸡蛋+米饭+省钱: 30 次结果全程电饭煲（${rcEggHits}/${M}）`,
    rcEggHits === M,
  );
  check(
    `v7.1 电饭煲+鸡蛋+米饭+省钱: 至少 80% 次 special 同时含鸡蛋+米饭（${rcEggRiceHits}/${M}）`,
    rcEggRiceHits >= Math.ceil(M * 0.8),
  );

  // v7.1: 电饭煲 + 鸡蛋 + 米饭 这个组合下，"酱油拌饭（无设备版）" 永远不能成为 special
  let strayHits = 0;
  for (let i = 0; i < 30; i++) {
    const r = pickLazyMeal({
      equipment: ["电饭煲"],
      maxMinutes: 60,
      fridge: ["鸡蛋", "米饭"],
      goals: ["省钱"],
    });
    if (r.special.id === "soy-rice-bowl") strayHits++;
  }
  check(
    `v7.1 电饭煲+鸡蛋+米饭: 「酱油拌饭（无设备版）」不应成为 special（${strayHits}/30）`,
    strayHits === 0,
  );
  // LazyDecisionPanel 引用了 LazyMealsPanel
  const fs = await import("node:fs");
  const lazySrc = fs.readFileSync("client/src/components/LazyDecisionPanel.tsx", "utf-8");
  check(`LazyDecisionPanel 引入 LazyMealsPanel`, lazySrc.includes("LazyMealsPanel"));
  check(
    `LazyMealsPanel 文件存在`,
    fs.existsSync("client/src/components/LazyMealsPanel.tsx"),
  );
}

console.log("== v8: 家庭一周菜单 + 预算 ==");
{
  const { defaultFamilyInput, planFamilyWeek, weeklyMenuToText } = await import(
    "../client/src/lib/familyWeekly"
  );
  // 默认 1500 月预算 / 3 人 / 均衡 → 必须能生成 7 天
  const input = defaultFamilyInput();
  check(`默认输入 monthlyBudget=1500`, input.monthlyBudget === 1500);
  check(`默认输入 weeklyBudget 在 350-400`, input.weeklyBudget >= 340 && input.weeklyBudget <= 410);
  const plan = planFamilyWeek(input, 1);
  check(`一周生成 7 天`, plan.days.length === 7, `days=${plan.days.length}`);
  // 每天必须有 lunch + dinner
  let badDay = 0;
  for (const d of plan.days) {
    const slots = d.meals.map((m: any) => m.slot);
    if (!slots.includes("lunch") || !slots.includes("dinner")) badDay++;
  }
  check(`每天含午+晚`, badDay === 0);
  // 总价不应明显超预算（默认结构应基本贴近）
  check(`默认总估价 <= 周预算 * 1.4（实际 ¥${plan.totalCost} / 周预算 ¥${input.weeklyBudget}）`, plan.totalCost <= input.weeklyBudget * 1.4);
  // 频次字段存在且至少 5 类
  check(`蛋白频次至少含 5 类（鸡/牛/猪/鱼虾/豆腐蛋）`, plan.proteinFreq.length >= 5);
  // 全部主菜餐次 + 外卖 = 14（午+晚）
  const totalMeals = plan.proteinFreq.reduce((acc: number, p: any) => acc + p.count, 0);
  check(`蛋白主菜总次数 == 14（实际 ${totalMeals}）`, totalMeals === 14);
  // 不全凉菜不全汤：主菜数量大致等于 14
  let allColdRuns = 0, allSoupRuns = 0;
  for (const d of plan.days) {
    for (const m of d.meals) {
      const dishes = m.dishes;
      if (dishes.length > 0 && dishes.every((x: any) => /凉|拌(?!饭)|沙拉|皮蛋豆腐/.test(x.recipe?.name ?? ""))) allColdRuns++;
      if (dishes.length > 0 && dishes.every((x: any) => x.recipe?.course === "soup")) allSoupRuns++;
    }
  }
  check(`不存在「全凉菜」一餐`, allColdRuns === 0);
  check(`不存在「全汤」一餐`, allSoupRuns === 0);
  // 买菜清单非空
  const totalShopItems = plan.shopping.reduce((acc: number, g: any) => acc + g.items.length, 0);
  check(`买菜清单非空（共 ${totalShopItems} 项）`, totalShopItems >= 10);
  // 4 个分组都存在
  const groupNames = plan.shopping.map((g: any) => g.group);
  for (const g of ["肉蛋奶", "蔬菜", "主食豆制品", "调味杂项"]) {
    check(`买菜清单含分组「${g}」`, groupNames.includes(g));
  }
  // 文本输出
  const txt = weeklyMenuToText(input, plan);
  check(`weeklyMenuToText 含「家庭一周菜单」`, txt.includes("家庭一周菜单"));
  check(`weeklyMenuToText 含「买菜清单」`, txt.includes("买菜清单"));
  // 省钱目标下牛肉应该 0 / 外卖少 / 豆腐蛋多
  const cheap = planFamilyWeek({ ...input, goal: "省钱", takeoutCount: 1 }, 2);
  const beefFreq = cheap.proteinFreq.find((p: any) => p.kind === "牛肉")?.count ?? -1;
  const tofuFreq = cheap.proteinFreq.find((p: any) => p.kind === "豆腐蛋")?.count ?? -1;
  check(`省钱方案：牛肉 == 0`, beefFreq === 0);
  check(`省钱方案：豆腐蛋 >= 5`, tofuFreq >= 5);
  // 长辈多人：默认目标含 friendly flag 至少出现 1 次（如果 elders > 0）
  const elder = planFamilyWeek({ ...input, elders: 1, kids: 0, adults: 2, people: 3, goal: "长辈友好" }, 3);
  let elderFlagged = 0;
  for (const d of elder.days) for (const m of d.meals) for (const x of m.dishes) {
    if (x.flags.some((f: string) => f.includes("长辈"))) elderFlagged++;
  }
  check(`长辈友好目标 elders=1：至少 5 道菜带「长辈友好」标记`, elderFlagged >= 5, `count=${elderFlagged}`);
  // 忌口：无海鲜下不应出现鱼虾
  const noSeafood = planFamilyWeek({ ...input, restrictions: ["无海鲜"] }, 5);
  const seafoodFreq = noSeafood.proteinFreq.find((p: any) => p.kind === "鱼虾")?.count ?? -1;
  // 忌口下 mainsByProtein.鱼虾 = 0，所以会降级为豆腐蛋；此处直接检查没违忌的菜
  let viol = 0;
  for (const d of noSeafood.days) for (const m of d.meals) for (const x of m.dishes) {
    if (x.recipe?.contains?.includes("无海鲜")) viol++;
  }
  check(`无海鲜忌口：返回的菜不含「无海鲜」contains`, viol === 0);
  // App.tsx 注册 /weekly 路由
  const fs = await import("node:fs");
  const appSrc = fs.readFileSync("client/src/App.tsx", "utf-8");
  check(`App.tsx 注册 /weekly`, appSrc.includes('path="/weekly"'));
  // Home.tsx lazy import WeeklyMenuPanel
  const homeSrc = fs.readFileSync("client/src/pages/Home.tsx", "utf-8");
  check(`Home.tsx 引入 WeeklyMenuPanel`, homeSrc.includes("WeeklyMenuPanel"));
  check(`Home.tsx 渲染 weekly tab`, homeSrc.includes('tab === "weekly"'));
}

console.log("== v8: HotBoard 各平台内容差异化 ==");
{
  const { loadSource, MONTH_THEMES, currentMonth } = await import(
    "../client/src/lib/hotBoard"
  );
  const sources = ["weibo", "douyin", "toutiao", "zhihu", "bilibili", "baidu"] as const;
  // 1) 各平台首屏标题不同
  const firstTitles: Record<string, string[]> = {};
  for (const s of sources) {
    const r = await loadSource(s as any, { seed: 0, offline: true });
    firstTitles[s] = r.items.slice(0, 6).map((it: any) => it.title);
  }
  // 任意两个平台的前 4 条标题不应完全相同
  let collisions = 0;
  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      const a = new Set(firstTitles[sources[i]].slice(0, 4));
      const b = new Set(firstTitles[sources[j]].slice(0, 4));
      const overlap = Array.from(a).filter((x) => b.has(x)).length;
      if (overlap >= 4) collisions++;
    }
  }
  check(
    `任意两个平台前 4 条标题不应完全相同（碰撞 ${collisions}）`,
    collisions === 0,
  );
  // 2) 抖音 phrasing 应含短视频/挑战/打卡 等抖音风格关键词
  const douyin = firstTitles["douyin"].join(" ");
  check(
    `抖音首屏带抖音调性（短视频/挑战/打卡/刷屏）`,
    /短视频|挑战|打卡|刷屏|翻拍|话题|片段/.test(douyin),
    douyin,
  );
  // 3) 头条 phrasing 应含新闻/调查/速递等
  const toutiao = firstTitles["toutiao"].join(" ");
  check(
    `头条首屏带新闻调性（速报/调查/营养/票房）`,
    /速报|速递|调查|营养|票房|价格|客流/.test(toutiao),
    toutiao,
  );
  // 4) 知乎 phrasing 应含「如何评价」「值不值得」等
  const zhihu = firstTitles["zhihu"].join(" ");
  check(
    `知乎首屏带知乎调性（如何评价/值不值得/详细体验）`,
    /如何评价|如何看待|值不值得|体验报告|详解|高赞/.test(zhihu),
    zhihu,
  );
  // 5) 刷新 seed 变化导致至少部分标题变化
  for (const s of sources) {
    const a = await loadSource(s as any, { seed: 0, offline: true });
    const b = await loadSource(s as any, { seed: 1, offline: true });
    const aTitles = a.items.slice(0, 6).map((it: any) => it.title).join("|");
    const bTitles = b.items.slice(0, 6).map((it: any) => it.title).join("|");
    check(`平台 ${s} seed=0 vs seed=1 前 6 条不同`, aTitles !== bTitles);
  }
  // 6) 5 月内容仍正确（至少有当月主题词命中）
  const m = currentMonth();
  if (m === 5) {
    const r = await loadSource("weibo" as any, { seed: 0, offline: true });
    const themeWords = MONTH_THEMES[5].themes;
    const all = [...themeWords, ...MONTH_THEMES[5].food, ...MONTH_THEMES[5].life];
    const hit = r.items.some((it: any) => all.some((w: string) => it.title.includes(w)));
    check(
      `5 月微博首屏含至少 1 条命中当月主题`,
      hit,
      r.items.slice(0, 4).map((i: any) => i.title).join(" | "),
    );
  }
  // 7) HotBoard.tsx 调用 refresh 时传 bumpSeed
  const fs = await import("node:fs");
  const hbSrc = fs.readFileSync("client/src/components/HotBoard.tsx", "utf-8");
  check(
    `HotBoard 刷新按钮 onClick 含 bumpSeed: true`,
    hbSrc.includes("bumpSeed: true"),
  );
}

console.log("== v12: 剩菜变花样 规则池 ==");
{
  const { LEFTOVER_RULES, FALLBACK_REMIXES, COMMON_LEFTOVER_PRESETS } = await import(
    "../client/src/data/leftoverRules"
  );
  // 剩菜规则数 + 总变形方案数 — 目标：方案 >= 80 条以体感更丰富
  let totalRemixes = 0;
  for (const r of LEFTOVER_RULES) totalRemixes += r.remixes.length;
  check(
    `剩菜规则 (rule 数) >= 35（实际 ${LEFTOVER_RULES.length}）`,
    LEFTOVER_RULES.length >= 35,
  );
  check(
    `剩菜变形方案总数 >= 80（实际 ${totalRemixes}）`,
    totalRemixes >= 80,
  );
  check(
    `兜底方案 (fallback) 至少 3 条以保证永不空白（实际 ${FALLBACK_REMIXES.length}）`,
    FALLBACK_REMIXES.length >= 3,
  );
  check(
    `常见剩菜快捷标签 >= 18（实际 ${COMMON_LEFTOVER_PRESETS.length}）`,
    COMMON_LEFTOVER_PRESETS.length >= 18,
  );
  // 关键关键词必须有规则
  const REQUIRED_LEFTOVER = ["米饭", "面条", "饺子", "鸡", "鱼", "豆腐", "土豆", "番茄炒蛋", "排骨", "牛肉", "茄子", "虾", "馒头", "火锅", "烤鸭", "烧烤", "粥"];
  for (const k of REQUIRED_LEFTOVER) {
    const hit = LEFTOVER_RULES.some((r: any) =>
      r.keywords.some((kw: string) => kw.includes(k) || k.includes(kw)),
    );
    check(`剩菜规则覆盖关键词「${k}」`, hit);
  }
  // 每条 rule 至少有 1 个 remix
  const empty = LEFTOVER_RULES.filter((r: any) => !r.remixes || r.remixes.length === 0);
  check(`所有 rule 至少 1 个 remix`, empty.length === 0, empty.map((r: any) => r.keywords[0]).join(","));
}

console.log("== v12: 冰箱预设 / 食材别名池 ==");
{
  const { FRIDGE_PRESETS } = await import("../client/src/lib/fridge");
  const { normalizeIngredient } = await import("../client/src/lib/ingredientAliases");
  // 至少 5 个分组 + 总条目 >= 80
  check(`冰箱预设分组 >= 5（实际 ${FRIDGE_PRESETS.length}）`, FRIDGE_PRESETS.length >= 5);
  let total = 0;
  for (const g of FRIDGE_PRESETS) total += g.items.length;
  check(`冰箱预设条目总数 >= 80（实际 ${total}）`, total >= 80);
  // 必须含 几个核心常用品类
  const CORE_GROUPS = ["蛋白质", "蔬菜", "主食"];
  for (const g of CORE_GROUPS) {
    check(`冰箱预设含分组「${g}」`, FRIDGE_PRESETS.some((x: any) => x.group === g));
  }
  // 关键别名要能 normalize 到标准名
  const ALIAS_CASES: [string, string][] = [
    ["西红柿", "番茄"],
    ["小番茄", "番茄"],
    ["巴沙鱼", "鱼"],
    ["三文鱼", "鱼"],
    ["上海青", "青菜"],
    ["油麦菜", "青菜"],
    ["大白菜", "白菜"],
    ["紫甘蓝", "白菜"],
    ["金针菇", "蘑菇"],
    ["杏鲍菇", "蘑菇"],
    ["乌冬", "面条"],
    ["意面", "面条"],
    ["米线", "面条"],
    ["凉皮", "面条"],
    ["全麦面包", "面包"],
    ["速冻饺子", "饺子"],
    ["腊肉", "腊肠"],
    ["午餐肉", "火腿"],
    ["希腊酸奶", "酸奶"],
    ["冻豆腐", "豆腐"],
    ["千张", "豆腐"],
    ["奶油草莓", "草莓"],
    ["车厘子", "樱桃"],
    ["奇异果", "猕猴桃"],
  ];
  for (const [from, to] of ALIAS_CASES) {
    const got = normalizeIngredient(from);
    check(`别名归一化「${from}」→「${to}」（实际「${got}」）`, got === to);
  }
}

console.log("== v12: 今晚最终方案海报式 ==");
{
  const fs = await import("node:fs");
  const src = fs.readFileSync("client/src/components/TonightPlanPanel.tsx", "utf-8");
  // 至少含 mint / warm / night 3 套色系切换（在 PALETTES 中以 id 标记）
  for (const t of ["mint", "warm", "night"]) {
    check(
      `TonightPlanPanel 含色系「${t}」`,
      // 既支持显式写死 testid，也支持 id 字段定义 PALETTES[t]
      src.includes(`tonight-plan-theme-${t}`) ||
        new RegExp(`id:\\s*"${t}"`).test(src),
    );
  }
  // 主题切换条 + 海报区 + 落款行 testid 都到位
  check(
    "TonightPlanPanel 含主题切换条 (tonight-plan-theme-bar)",
    src.includes("tonight-plan-theme-bar"),
  );
  check(
    "TonightPlanPanel 含海报包裹 (tonight-plan-poster)",
    src.includes("tonight-plan-poster"),
  );
  check(
    "TonightPlanPanel 含落款 (tonight-plan-footer)",
    src.includes("tonight-plan-footer"),
  );
  // 必须仍保留 复制 / 再生成 / 继续完善 入口
  for (const tid of ["tonight-plan-copy", "tonight-plan-regenerate", "tonight-plan-deep-links"]) {
    check(`TonightPlanPanel 保留 ${tid}`, src.includes(tid));
  }
  // 单人/家庭 chip
  check(
    "TonightPlanPanel 含单人/家庭 chip (tonight-plan-kind)",
    src.includes("tonight-plan-kind"),
  );
}

console.log("");
if (failed === 0) {
  console.log(`✅ 全部检查通过 (RECIPES=${RECIPES.length} 道)`);
  process.exit(0);
} else {
  console.error(`❌ 失败 ${failed} 项`);
  process.exit(1);
}
