import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";
import { applyPageSize, loadPageSize } from "./lib/pageSize";

applyPageSize(loadPageSize());

if (!window.location.hash) {
  window.location.hash = "#/";
}

createRoot(document.getElementById("root")!).render(<App />);

// PWA: 注册 SW（仅在生产环境 / https / localhost 下生效；开发态 vite 自带 HMR，不注册）
registerServiceWorker();
