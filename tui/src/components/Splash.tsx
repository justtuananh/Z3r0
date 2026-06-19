import { Logo } from "./Logo"
import { C, accentFor, markerFor, shortHost } from "../lib/theme"

export function Splash({
  model,
  baseUrl,
  configured,
}: {
  model: string
  baseUrl: string
  configured: boolean
}) {
  const host = shortHost(baseUrl, 34)
  const accent = accentFor(model)
  return (
    <box style={{ flexGrow: 1, flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <Logo />
      <box style={{ height: 1 }} />
      <text fg={C.dim}>{"Ctrl+M model    Ctrl+T reasoning    Ctrl+E endpoint    Esc quit"}</text>
      <box style={{ height: 1 }} />
      <box style={{ flexDirection: "row", gap: 1 }}>
        <text fg={accent}>{`${markerFor(model)} ${model}`}</text>
        <text fg={configured ? C.cyan : C.red}>{host}</text>
      </box>
    </box>
  )
}
