/**
 * Where a `position: fixed` popover menu should portal to.
 *
 * A dialog's scroll-lock (react-remove-scroll) cancels WHEEL events on anything
 * portaled outside its DOM, so a `<body>`-portaled menu can't wheel-scroll while
 * a dialog/sheet is open. Portaling the menu *inside* fixes that.
 *
 * BUT centered dialogs establish a containing block for `position: fixed` (via a
 * transform / will-change that `getComputedStyle().transform` doesn't reliably
 * report), which would offset a fixed menu portaled into them. Side **sheets**
 * (`SheetContent`, marked `data-sheet-content`) don't — they're inset-positioned
 * with no persistent containing block — so we portal into sheets only, and keep
 * the `<body>` portal everywhere else (centered dialogs' menus are viewport-fixed
 * and correct; their lists are short and the search box covers long ones).
 */
export function resolvePortalTarget(trigger: HTMLElement | null): HTMLElement {
  if (typeof document === "undefined") return null as unknown as HTMLElement;
  const sheet = trigger?.closest("[data-sheet-content]") as HTMLElement | null;
  return sheet ?? document.body;
}
