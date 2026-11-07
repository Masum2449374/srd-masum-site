import { useEffect } from "react";

// Keyboard focus stays in the foremost modal; nested credits take precedence.
export function useDialogFocus(ref, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const previous = document.activeElement;
    const dialog = ref.current;
    const selectors =
      'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select,[tabindex="0"]';
    const focusable = () =>
      [...(dialog?.querySelectorAll(selectors) || [])].filter(
        (e) => e.getClientRects().length > 0,
      );
    focusable()[0]?.focus({ preventScroll: true });
    const key = (e) => {
      if (e.key !== "Tab" || !dialog) return;
      if (
        document.activeElement?.closest('[role="dialog"]') !== dialog &&
        !dialog.contains(document.activeElement)
      )
        return;
      if (
        document.activeElement?.closest('[role="dialog"]') !== dialog &&
        dialog.contains(document.activeElement)
      )
        return;
      const els = focusable(),
        first = els[0],
        last = els[els.length - 1];
      if (!first) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [ref, enabled]);
}
