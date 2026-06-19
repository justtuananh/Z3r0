import type { Command } from "../lib/commands"
import { C } from "../lib/theme"

export function CommandMenu({ commands, selected }: { commands: Command[]; selected: number }) {
  return (
    <box style={{ flexDirection: "column", flexShrink: 0, border: true, borderColor: C.cyan, paddingLeft: 1, paddingRight: 1 }}>
      {commands.length === 0 ? (
        <text fg={C.red}>no matching command — try /help</text>
      ) : (
        commands.map((c, i) => {
          const active = i === selected
          return (
            <box key={c.name} style={{ flexDirection: "row", gap: 1 }}>
              <text fg={active ? C.cyanHi : C.dimmer}>{active ? "›" : " "}</text>
              <text fg={active ? C.cyanHi : C.cyan}>{"/" + c.name}</text>
              <text fg={C.dim}>{active && c.usage ? c.usage : c.description}</text>
            </box>
          )
        })
      )}
    </box>
  )
}
