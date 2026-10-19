/* Service Worker — 「今天吃什么」最简 PWA：
 * 设计原则：
 *  - 不用 Workbox / 任何打包依赖：纯手写 SW，避免引入重依赖。
 *  - cache-first for built static assets（hashed JS/CSS/woff2/svg/png/webp/ico），
 *    network-first for HTML（确保新版本上线后下一次访问就能拿到新 index.html）。
 *  - SW 的 scope 自动是文件所在目录（如 GitHub Pages 子路径部署），
 *    全部用 self.registration.scope，不硬写 base path，避免在不同部署路径下挂错。
 *  - 第三方域（fontshare / 图片源 wikimedia / themealdb）不缓存：那些是动态、且
 *    有自己的浏览器 HTTP 缓存。
 *  - 暴露 SKIP_WAITING 消息，配合 main.tsx 的 update 流程让用户拿到新版本。
 */

const VERSION = "v3-2026-05-07";
const STATIC_CACHE = `chishenme-static-${VERSION}`;
const HTML_CACHE = `chishenme-html-${VERSION}`;

// 仅缓存站内 + 同目录下的资源；第三方域跳过。
const SAME_ORIGIN_RE = new RegExp("^" + self.location.origin.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"));
// 静态资产判定：vite build 出来的 hashed 文件名带 8+ 位 hash；保险起见用扩展名匹配。
const STATIC_EXT_RE = /\.(?:js|mjs|css|woff2?|ttf|otf|svg|png|jpg|jpeg|webp|gif|ico|webmanifest)$/i;
// app shell：相对于 SW 注册路径，缓存关键入口。registration.scope 末尾必有斜杠。
function shellUrls() {
  const base = self.registration.scope; // 末尾必有斜杠，自动适配子路径部署
  return [base, base + "index.html", base + "manifest.webmanifest", base + "favicon.svg"];
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // 不强制全部成功，避免单个 404 阻塞 install
      await Promise.all(
        shellUrls().map((u) => cache.add(u).catch(() => null)),
      );
      // 立即生效，让 active 直接接管
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== HTML_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 只代理同源 GET；第三方域（fontshare / wikimedia / themealdb）走浏览器原生缓存
  if (!SAME_ORIGIN_RE.test(url.origin)) return;

  // HTML 文档：network-first，离线时回 cache
  const accept = req.headers.get("accept") || "";
  if (req.mode === "navigate" || accept.includes("text/html")) {
    event.respondWith(networkFirstHtml(req));
    return;
  }

  // 静态资产：cache-first，未命中则 fetch + 写回
  if (STATIC_EXT_RE.test(url.pathname)) {
    event.respondWith(cacheFirstStatic(req));
    return;
  }

  // 其它（API 等）默认 passthrough，也不缓存
});

async function networkFirstHtml(request) {
  const cache = await caches.open(HTML_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone()).catch(() => null);
    }
    return fresh;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // 终极兜底：scope 下的 index.html
    const indexCached = await cache.match(self.registration.scope + "index.html");
    if (indexCached) return indexCached;
    throw e;
  }
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && fresh.ok) {
    cache.put(request, fresh.clone()).catch(() => null);
  }
  return fresh;
}
