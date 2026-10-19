// 外卖地区覆盖冒烟测试。
// npx tsx script/check-takeout-region.ts

import { pickTakeout, TAKEOUT_BRANDS, findBrandByQuery } from "../client/src/data/takeoutBrands";
import { matchCoverage, inferCoverage } from "../client/src/lib/takeoutCoverage";

let failed = 0;
function check(label: string, ok: boolean, detail?: string) {
  if (ok) console.log("  ✓ " + label);
  else {
    failed++;
    console.error("  ✗ " + label + (detail ? "\n      " + detail : ""));
  }
}

console.log("== 覆盖推断 ==");
{
  const xiang = findBrandByQuery("南城香");
  check("南城香存在", !!xiang);
  if (xiang) {
    const cov = inferCoverage(xiang);
    check("南城香命中北京", cov.cities.includes("北京") || cov.provinces.includes("北京"), JSON.stringify(cov));
    const bj = matchCoverage(xiang, "北京", "北京");
    const gz = matchCoverage(xiang, "广州", "广东");
    check("南城香在北京不是 rare", bj.level !== "rare", bj.level + " " + bj.score);
    check("南城香在广州分数低于北京", gz.score < bj.score, "bj=" + bj.score + " gz=" + gz.score);
  }
  const xiangcun = findBrandByQuery("乡村基");
  check("乡村基存在", !!xiangcun);
  if (xiangcun) {
    const cd = matchCoverage(xiangcun, "成都", "四川");
    const bj = matchCoverage(xiangcun, "北京", "北京");
    check("乡村基在成都可点", cd.available && cd.score > bj.score, "cd=" + cd.level + cd.score + " bj=" + bj.level + bj.score);
  }
}

console.log("== 选城后主推不是 rare ==");
for (const city of ["成都", "北京", "广州", "上海", "武汉", "西安"] as const) {
  const r = pickTakeout({ city, budget: 40, people: 1, tastes: [], slot: "lunch", seed: 7 });
  const cov = r.coverageById[r.special.id];
  check(city + " 主推可点: " + r.special.name, !!cov && cov.available && cov.level !== "rare", cov ? cov.level + " " + cov.label : "no coverage");
  check(city + " 有备选", r.alternatives.length >= 3, String(r.alternatives.length));
}

console.log("== 成都 vs 广州 结果会分化 ==");
{
  const cd = pickTakeout({ city: "成都", province: "四川", budget: 40, people: 1, tastes: ["辣"], slot: "lunch", seed: 3 });
  const gz = pickTakeout({ city: "广州", province: "广东", budget: 40, people: 1, tastes: ["清淡"], slot: "lunch", seed: 3 });
  check("两城主推不完全相同或覆盖标签不同", cd.special.id !== gz.special.id || cd.coverageById[cd.special.id].label !== gz.coverageById[gz.special.id].label, cd.special.name + " / " + gz.special.name);
}

console.log("== 外地连锁不应在主场外当主推 ==");
{
  const yue = findBrandByQuery("粤饺皇");
  if (yue) {
    const wh = matchCoverage(yue, "武汉", "湖北");
    check("粤饺皇在武汉不是本地可点", !wh.available || wh.level === "rare", wh.level + " " + String(wh.available));
  }
  const r = pickTakeout({ city: "武汉", province: "湖北", budget: 40, people: 1, tastes: [], slot: "lunch", seed: 7 });
  check("武汉主推不是粤饺皇", r.special.name !== "粤饺皇", r.special.name);
}

console.log("== 品牌池仍完整 ==");
check("品牌数 >= 300", TAKEOUT_BRANDS.length >= 300, String(TAKEOUT_BRANDS.length));

if (failed) {
  console.error("\nfailed: " + failed);
  process.exit(1);
}
console.log("\nall passed");
