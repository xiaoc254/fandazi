import { useEffect, useState } from "react";
import { fetchDishImage, type ImageResult } from "@/lib/imageProvider";

/** 异步拉取一张菜品真实示意图（Wikimedia / TheMealDB）。
 *  - 加载中时返回 { state: "loading", url: null }
 *  - 命中：{ state: "loaded", url, source }
 *  - 未命中或图片本身加载失败：{ state: "fallback", url: null }
 *  调用方可结合本地 DishImage 作 fallback。 */
export type DishPhotoState =
  | { state: "loading"; url: null; source: null }
  | { state: "loaded"; url: string; source: ImageResult["source"] }
  | { state: "fallback"; url: null; source: null };

export function useDishPhoto(name: string | undefined, enabled = true): DishPhotoState {
  const [state, setState] = useState<DishPhotoState>({ state: "loading", url: null, source: null });

  useEffect(() => {
    if (!enabled || !name) {
      setState({ state: "fallback", url: null, source: null });
      return;
    }
    let cancelled = false;
    setState({ state: "loading", url: null, source: null });
    fetchDishImage(name)
      .then((res) => {
        if (cancelled) return;
        if (res) setState({ state: "loaded", url: res.url, source: res.source });
        else setState({ state: "fallback", url: null, source: null });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ state: "fallback", url: null, source: null });
      });
    return () => {
      cancelled = true;
    };
  }, [name, enabled]);

  /** 对外暴露：图片本身加载失败时手动 fallback。 */
  return state;
}
