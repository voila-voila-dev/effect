/**
 * Which viewports a scroll lock applies to:
 * - `"all"` freezes scroll everywhere (a cart that is a side sheet on desktop
 *   and full-screen on mobile).
 * - `"mobile"` freezes scroll only below `md`. `landing.css` releases it above
 *   `md` on its own, so a surface hidden on desktop (the burger menu) never
 *   leaves the page frozen — no resize listener.
 * - `"below-xl"` is the same below `xl`, for a burger menu that stays until `xl`.
 */
export type ScrollLockScope = "all" | "mobile" | "below-xl";
