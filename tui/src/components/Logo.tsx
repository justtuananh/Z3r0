import { useState } from "react"
import { C } from "../lib/theme"

type Line = { t: string; c: string }

// Lowercase z3r0 block glyphs (5 rows). The 'r' has a diagonal leg so it reads R, not P.
const GLYPHS: Record<string, string[]> = {
  z: ["█████", "   ██", "  ██ ", " ██  ", "█████"],
  "3": ["█████", "   ██", " ████", "   ██", "█████"],
  r: ["█████", "██  █", "█████", "██ █ ", "██  █"],
  "0": ["█████", "██ ██", "██ ██", "██ ██", "█████"],
}
const WORD = ["z", "3", "r", "0"] as const
const WROWS = Array.from({ length: 5 }, (_, i) => WORD.map((ch) => GLYPHS[ch]![i]).join(" "))
const WW = WROWS[0]!.length
const SPLIT = Math.floor(WW * 0.46) // red/cyan chromatic seam

// Metasploit-style: a random themed header is drawn each launch; z3r0 stays centered below it.
const BANNERS: Line[][] = [
  [
    { t: "      .-----.      ", c: C.dim },
    { t: "     | x   x |     ", c: C.red },
    { t: "     |   ^   |     ", c: C.redSoft },
    { t: "     | ::::: |     ", c: C.red },
    { t: "      '-----'      ", c: C.dim },
  ],
  [
    { t: "┌─[⌁]────────────[⌁]─┐", c: C.cyan },
    { t: "│  ▚ S Y S B R K ▚   │", c: C.cyanHi },
    { t: "└─[⌁]────────────[⌁]─┘", c: C.cyan },
  ],
  [
    { t: "1 0 1 1 0 1 0 0 1 1 0 1", c: C.dim },
    { t: " 0 1 0   N U L L   1 0 ", c: C.cyan },
    { t: "1 1 0 1 0 0 1 0 1 1 0 1", c: C.dim },
  ],
  [
    { t: "▟▙▟▙▟▙▟▙ DANGER ▟▙▟▙▟▙▟▙", c: C.red },
    { t: "   no guardrails online   ", c: C.redSoft },
  ],
  [
    { t: "▓▒░  ░▒▓  ▓▒░  ░▒▓  ▓▒░", c: C.magenta },
    { t: "≋≋≋  SIGNAL  CORRUPT  ≋≋≋", c: C.cyan },
  ],
  [
    { t: "★ ───── WANTED ───── ★", c: C.amber },
    { t: "   the refusal direction  ", c: C.dim },
  ],
]

// Constant metasploit-style footer.
const FOOTER: Line[] = [
  { t: "      =[ z3r0 v0.1.0 · abliteration study ]", c: C.dim },
  { t: "+ -- --=[ 3 models · control · huihui · obliteratus ]", c: C.dim },
  { t: "+ -- --=[ refusal direction: REMOVED ]", c: C.red },
]

export function Logo({ bannerIndex }: { bannerIndex?: number }) {
  // Pick once per launch (lazy init), like msfconsole's random banner.
  const [idx] = useState(() => bannerIndex ?? Math.floor(Math.random() * BANNERS.length))
  const banner = BANNERS[idx % BANNERS.length]!
  return (
    <box style={{ flexDirection: "column", alignItems: "center" }}>
      {banner.map((l, i) => (
        <text key={`t${i}`} fg={l.c}>
          {l.t}
        </text>
      ))}
      <box style={{ height: 1 }} />
      {WROWS.map((row, i) => {
        const s = Math.max(0, Math.min(WW, SPLIT))
        return (
          <box key={`w${i}`} style={{ flexDirection: "row" }}>
            <text fg={C.red}>{row.slice(0, s)}</text>
            <text fg={C.cyanHi}>{row.slice(s)}</text>
          </box>
        )
      })}
      <box style={{ height: 1 }} />
      {FOOTER.map((l, i) => (
        <text key={`f${i}`} fg={l.c}>
          {l.t}
        </text>
      ))}
    </box>
  )
}
