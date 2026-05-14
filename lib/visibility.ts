/**
 * Listen for tab visibility changes. Returns a cleanup function.
 * onHide fires when the user tabs away; onShow fires when they return.
 */
export function onVisibilityChange(
  onHide: () => void,
  onShow: () => void
): () => void {
  if (typeof document === "undefined") return () => {};

  const handler = () => {
    if (document.hidden) onHide();
    else onShow();
  };

  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}
