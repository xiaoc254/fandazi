import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  base: "./",
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // 把大数据集拆出独立 chunk，避免阻塞主 bundle 解析。
    // 移动端 gzipped 后这些数据约 80-150KB，并行下载不卡 UI。
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("client/src/data/recipes.generated")) return "data-recipes";
          if (id.includes("client/src/data/recipes.ts")) return "data-recipes";
          if (id.includes("client/src/data/companions")) return "data-companions";
          if (id.includes("client/src/data/takeoutBrands")) return "data-takeout";
          if (id.includes("client/src/data/takeout.ts")) return "data-takeout";
          if (id.includes("client/src/data/snacks")) return "data-snacks";
          if (id.includes("client/src/data/fruits")) return "data-fruits";
          if (id.includes("client/src/data/cityFoods")) return "data-cityfoods";
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "vendor-react";
          if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
          if (id.includes("node_modules/lucide-react")) return "vendor-icons";
          if (id.includes("node_modules/framer-motion")) return "vendor-motion";
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
