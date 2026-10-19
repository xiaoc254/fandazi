// Playwright screenshot generator for README.
// Visits the running production server (NODE_ENV=production node dist/index.cjs on :5000)
// and captures each main tab + a mobile viewport.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.SCREENSHOT_BASE || "http://localhost:5000";
const OUT = path.resolve("docs/screenshots");

const desktop = { width: 1280, height: 900 };
const mobile = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const targets = [
  { hash: "#/home", file: "home.png", label: "今日推荐" },
  { hash: "#/weekly", file: "weekly.png", label: "一周菜单" },
  { hash: "#/lazy", file: "lazy.png", label: "懒人决定" },
  { hash: "#/family", file: "family.png", label: "家庭口味协调" },
  { hash: "#/fridge", file: "fridge.png", label: "冰箱有啥" },
  { hash: "#/leftover", file: "leftover.png", label: "剩菜变花样" },
  { hash: "#/takeout", file: "takeout.png", label: "外卖" },
  { hash: "#/snacks", file: "snacks.png", label: "零食" },
  { hash: "#/fruit", file: "fruit.png", label: "水果" },
  { hash: "#/health", file: "health.png", label: "健康饮食" },
  { hash: "#/search", file: "search.png", label: "菜谱搜索" },
  { hash: "#/companion", file: "companion.png", label: "饭桌陪伴" },
  { hash: "#/hotboard", file: "hotboard.png", label: "饭桌热榜" },
];

async function setup(page, opts = {}) {
  // Skip onboarding (modal blocks layout) by pre-seeding localStorage flags.
  // v10: also seed family/fridge demo data so the new tabs are not empty in screenshots.
  await page.addInitScript((skipPersona) => {
    try {
      localStorage.setItem("chishenme.onboarded.v1", "1");
      if (skipPersona) {
        localStorage.setItem("chishenme.persona.setup.v1", "true");
      }
      // Family demo
      const family = [
        { id: "fm_demo_self", name: "我", role: "self", emoji: "👤", dislikedIngredients: ["香菜"], allergicIngredients: [], healthGoals: ["low_fat"], active: true },
        { id: "fm_demo_partner", name: "老王", role: "partner", emoji: "💑", dislikedIngredients: [], allergicIngredients: [], healthGoals: ["balanced"], active: true },
        { id: "fm_demo_child", name: "小宝", role: "child", emoji: "🧒", dislikedIngredients: ["辣椒", "苦瓜"], allergicIngredients: ["花生"], healthGoals: ["balanced"], active: true },
        { id: "fm_demo_elder", name: "奶奶", role: "elder", emoji: "👴", dislikedIngredients: ["辣椒"], allergicIngredients: [], healthGoals: ["low_salt", "soft_easy"], active: true },
      ];
      localStorage.setItem("fanda.family.members.v1", JSON.stringify(family));
      // Fridge demo
      const fridge = [
        { id: "fr1", raw: "鸡蛋", normalized: "鸡蛋", quantity: "one", addedAt: Date.now() },
        { id: "fr2", raw: "豆腐", normalized: "豆腐", quantity: "half", addedAt: Date.now() },
        { id: "fr3", raw: "胡萝卜", normalized: "胡萝卜", quantity: "half", addedAt: Date.now() },
        { id: "fr4", raw: "番茄", normalized: "番茄", quantity: "one", addedAt: Date.now() },
        { id: "fr5", raw: "葱", normalized: "葱", quantity: "trace", addedAt: Date.now() },
        { id: "fr6", raw: "米饭", normalized: "米饭", quantity: "one", addedAt: Date.now() },
      ];
      localStorage.setItem("fanda.fridge.items.v1", JSON.stringify(fridge));
    } catch {}
  }, opts.skipPersona ?? true);
}

async function captureDesktop(browser, target) {
  const ctx = await browser.newContext({ viewport: desktop, locale: "zh-CN" });
  const page = await ctx.newPage();
  await setup(page);
  await page.goto(`${BASE}/${target.hash}`, { waitUntil: "networkidle", timeout: 60_000 });
  // Give framer-motion / lazy chunks a moment.
  await page.waitForTimeout(1500);
  // For the leftover tab: trigger a search so the screenshot has content.
  if (target.hash === "#/leftover") {
    try {
      await page.locator('[data-testid="chip-leftover-红烧肉"]').click({ timeout: 3000 });
      await page.waitForTimeout(800);
    } catch {}
  }
  // Make sure we're at the top.
  await page.evaluate(() => window.scrollTo(0, 0));
  const file = path.join(OUT, target.file);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`✓ desktop ${target.label} -> ${file}`);
  await ctx.close();
}

async function captureMobile(browser, target, file) {
  const ctx = await browser.newContext({ viewport: mobile, locale: "zh-CN", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1" });
  const page = await ctx.newPage();
  await setup(page);
  await page.goto(`${BASE}/${target.hash}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  const out = path.join(OUT, file);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`✓ mobile ${target.label} -> ${out}`);
  await ctx.close();
}

async function captureWelcome(browser) {
  // Persona welcome dialog: do NOT skip the persona setup flag, so the dialog
  // shows up automatically on first visit.
  const ctx = await browser.newContext({ viewport: desktop, locale: "zh-CN" });
  const page = await ctx.newPage();
  await setup(page, { skipPersona: false });
  await page.goto(`${BASE}/#/home`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(1500);
  // Click the role tile to advance to step 1 so the screenshot shows mood/health chips
  try {
    await page.locator('[data-testid="persona-role-fitness-cut"]').click({ timeout: 4000 });
    await page.waitForTimeout(500);
  } catch {}
  const file = path.join(OUT, "persona-welcome.png");
  await page.screenshot({ path: file, fullPage: false });
  console.log(`✓ desktop persona welcome -> ${file}`);
  await ctx.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const t of targets) {
    await captureDesktop(browser, t);
  }
  // Persona welcome popover (new in v9)
  await captureWelcome(browser);
  // Two extra mobile shots (home + lazy) so README has phone view.
  await captureMobile(browser, targets[0], "mobile-home.png");
  await captureMobile(browser, targets[2], "mobile-lazy.png");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
