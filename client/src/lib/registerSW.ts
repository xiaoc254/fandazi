// PWA Service Worker 注册：移动端二次访问命中本地 cache，提升首屏速度，并支持
// 离线兜底（HTML/SCRIPT/CSS 命中本地，应用 shell 仍可打开）。
//
// 设计：
//  - 仅在生产构建中注册（开发态 vite 有自己的 HMR，注册 SW 会导致缓存陈旧脚本）。
//  - 用相对路径 ./sw.js，自动适配 GitHub Pages /jin-tian-chi-shenme/ 的 base path。
//  - 每次启动 update() 一次，确保有更新就拿到；新 SW 自动 skipWaiting + claim
//    （由 sw.js 内部 install / activate 完成），下一次 navigate 即生效。
//  - 注册失败不影响主功能（这是渐进增强）。

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // dev 模式下不注册：vite 注入 HMR 客户端，缓存住老脚本会让 HMR 失灵
  // import.meta.env.DEV 在 dev 时为 true。
  if ((import.meta as any)?.env?.DEV) return;

  const swUrl = new URL("./sw.js", window.location.href).toString();

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(swUrl, { scope: "./" })
      .then((reg) => {
        // 主动 update：每次启动检查一次新 SW
        reg.update().catch(() => null);

        // 监听等待中的 SW（有更新但还没接管）→ 主动 SKIP_WAITING 让其上岗
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              installing.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {
        // 静默失败 — 站点仍可正常运行
      });

    // 当新 SW 接管后，刷新一次拿到新 chunks（防止用户长期停留导致旧 chunk）
    let refreshed = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshed) return;
      refreshed = true;
      // 不强制 reload，仅在用户下次切 Tab 回来或刷新时生效；这样不打断当前操作
      // 如果将来想立即生效，把下面一行打开：
      // window.location.reload();
    });
  });
}
