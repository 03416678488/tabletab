"use client";

import { useCallback, useRef } from "react";

/** Movement (px) past which a press becomes a drag rather than a click. */
const DRAG_THRESHOLD = 5;

/**
 * Horizontal drag-to-scroll for an `overflow-x` container (e.g. the POS category
 * strip). Grab-and-drag with a **mouse**; touch/pen keep native momentum
 * scrolling. A press that moves past `DRAG_THRESHOLD` scrolls and suppresses the
 * click on release, so buttons inside the row still fire on a real tap.
 *
 * Spread the returned props onto the scroller and attach `ref`:
 *   const drag = useDragScroll<HTMLDivElement>();
 *   <div ref={drag.ref} {...drag.handlers} className={cn("overflow-x-auto no-scrollbar", drag.className)} />
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const state = useRef({ down: false, moved: false, startX: 0, startLeft: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent<T>) => {
    // Mouse only — leave native scrolling (with momentum) to touch/pen.
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    state.current = {
      down: true,
      moved: false,
      startX: e.clientX,
      startLeft: el.scrollLeft,
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current;
    const s = state.current;
    if (!el || !s.down) return;
    const dx = e.clientX - s.startX;
    if (!s.moved && Math.abs(dx) > DRAG_THRESHOLD) {
      s.moved = true;
      el.setPointerCapture?.(e.pointerId);
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    }
    if (s.moved) {
      el.scrollLeft = s.startLeft - dx;
      e.preventDefault();
    }
  }, []);

  const endDrag = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current;
    const s = state.current;
    if (el && s.moved) {
      el.releasePointerCapture?.(e.pointerId);
      el.style.cursor = "";
      el.style.userSelect = "";
    }
    s.down = false;
  }, []);

  // Swallow the click that trails a drag so category buttons don't toggle.
  const onClickCapture = useCallback((e: React.MouseEvent<T>) => {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      state.current.moved = false;
    }
  }, []);

  return {
    ref,
    className: "cursor-grab",
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerLeave: endDrag,
      onClickCapture,
    },
  };
}
