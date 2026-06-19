import { C, accentFor, markerFor, shortHost, SPINNER } from "../lib/theme"
import { VERSION } from "../types"

export function StatusBar({
  model,
  baseUrl,
  showThink,
  busy,
  configured,
  tick,
}: {
  model: string
  baseUrl: string
  showThink: boolean
  busy: boolean
  configured: boolean
  tick: number
}) {
  const host = shortHost(baseUrl, 26)
  const accent = accentFor(model)
  const spin = SPINNER[tick % SPINNER.length] ?? "⠋"
  return (
    <box style={{ flexDirection: "row", paddingLeft: 1, paddingRight: 1 }}>
      <box style={{ flexDirection: "row", gap: 2, flexGrow: 1 }}>
        <text fg={accent}>{`${markerFor(model)} ${model}`}</text>
        <text fg={configured ? C.cyan : C.red}>{host}</text>
        <text fg={C.dim}>{`think:${showThink ? "on" : "off"}`}</text>
        <text fg={busy ? accent : C.dim}>{busy ? `${spin} streaming` : "○ idle"}</text>
      </box>
      <text fg={C.dim}>{`v${VERSION}`}</text>
    </box>
  )
}
