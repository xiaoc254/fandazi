// 页面大小（字号）设置：使用 CSS zoom 缩放整个主区域，对所有元素一致放大。
// 4 档：small / medium（≈旧版）/ default（新版默认，比旧版大一些）/ large。
// 持久化到 localStorage；不可写时仅保留会话内态。

const STORAGE_KEY = "chishenme.pageSize.v1";

export type PageSizeId = "small" | "medium" | "default" | "large";

export interface PageSizeMeta {
  id: PageSizeId;
  label: string;
  /** 缩放系数；medium=1.0（旧版），default=1.08（新版默认，比旧大一些）。 */
  zoom: number;
  hint: string;
}

export const PAGE_SIZES: PageSizeMeta[] = [
  { id: "small", label: "小", zoom: 0.9, hint: "紧凑，多内容" },
  { id: "medium", label: "中", zoom: 1.0, hint: "经典版" },
  { id: "default", label: "默认", zoom: 1.1, hint: "推荐 · 比中字大一些" },
  { id: "large", label: "大", zoom: 1.22, hint: "字大，看着轻松" },
];

export function getPageSizeMeta(id: PageSizeId): PageSizeMeta {
  return PAGE_SIZES.find((p) => p.id === id) ?? PAGE_SIZES[2];
}

export function loadPageSize(): PageSizeId {
  if (typeof window === "undefined") return "default";
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (raw && PAGE_SIZES.some((p) => p.id === raw)) return raw as PageSizeId;
  } catch {
    /* localStorage 不可用 */
  }
  return "default";
}

export function savePageSize(id: PageSizeId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

/** 应用 zoom 到 <html data-page-size>，CSS 选择器再把 zoom 落到 body。
 *  之所以走 data-attr + CSS 而不是直接给 body 设 zoom，是为了在 SSR/初始空 DOM
 *  时也能优雅 no-op；并且方便未来切换实现（rem / transform）。 */
export function applyPageSize(id: PageSizeId): void {
  if (typeof document === "undefined") return;
  const meta = getPageSizeMeta(id);
  try {
    document.documentElement.dataset.pageSize = id;
    // 同步设置 CSS 变量，body CSS 选择器引用它
    document.documentElement.style.setProperty("--page-zoom", String(meta.zoom));
  } catch {
    /* ignore */
  }
}
