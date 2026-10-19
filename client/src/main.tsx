import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";
import { applyPageSize, loadPageSize } from "./lib/pageSize";

// 首屏渲染前先落定缩放设置：
// 1) iOS 标记 —— CSS 需要据此关掉 body 的 zoom（iOS 上会破坏 fixed 定位），
//    否则会先按 zoom 排版、再回退，出现一次明显闪动；
// 2) --page-zoom —— 用上次选择的档位，避免首屏按默认 1.1 排版后再跳变。
applyPageSize(loadPageSize());

if (!window.location.hash) {
  window.location.hash = "#/";
}

createRoot(document.getElementById("root")!).render(<App />);

// PWA: 注册 SW（仅在生产环境 / https / localhost 下生效；开发态 vite 自带 HMR，不注册）
registerServiceWorker();
