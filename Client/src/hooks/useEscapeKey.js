import { useEffect } from "react";

/**
 * Calls `callback` when the Escape key is pressed.
 * Pass `enabled = false` to temporarily disable.
 */
export function useEscapeKey(callback, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      if (e.key === "Escape") callback();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [callback, enabled]);
}
