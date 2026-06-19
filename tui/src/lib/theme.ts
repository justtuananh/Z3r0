// Z3r0 TUI "dangerous" cyberpunk theme — neon glitch red+cyan, high contrast.
// Single source of truth for colors; every component imports from here.

export const C = {
  cyan: "#05d9e8", // primary accent / control model ("safe")
  cyanHi: "#54f2f2", // bright highlights, caret
  text: "#d1f7ff", // main answer text (cyan-tinted white)
  white: "#eaffff",
  red: "#ff003c", // danger / abliterated models / compliance
  redSoft: "#ff5c7a",
  magenta: "#ff2a6d", // assistant name / secondary glitch accent
  amber: "#ffd319", // warnings (used sparingly)
  dim: "#3a4a52", // muted borders / idle
  dimmer: "#1f2a30",
} as const

/** Abliterated/obliterated models are the "dangerous" ones; control keeps its refusal direction. */
export const isAbliterated = (model: string): boolean => model !== "control"

/** Accent that flips red on abliterated models, cyan on control — the core danger signal. */
export const accentFor = (model: string): string => (isAbliterated(model) ? C.red : C.cyan)

/** Per-model marker glyph for the status bar. */
export const markerFor = (model: string): string => (isAbliterated(model) ? "☠" : "◆")

export const SPINNER = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"

/** Short, single-line host label (cloudflared URLs are long and would wrap/overlap). */
export const shortHost = (url: string, n = 30): string => {
  let h = url
  try {
    h = url ? new URL(url).host : ""
  } catch {
    h = url
  }
  if (!h) return "(no endpoint — Ctrl+E)"
  return h.length > n ? h.slice(0, n - 1) + "…" : h
}
