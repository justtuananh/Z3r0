import type { Label, Message } from "../types"
import { C } from "../lib/theme"

const LABEL_COLOR: Record<Label, string> = {
  refusal: C.cyan, // refused = safe
  compliance: C.red, // complied = the spicy outcome
  empty: C.dim,
}

export function MessageView({
  msg,
  showThink,
  streaming,
  tick,
}: {
  msg: Message
  showThink: boolean
  streaming: boolean
  tick: number
}) {
  if (msg.role === "system") {
    return (
      <box style={{ flexDirection: "column", marginBottom: 1 }}>
        {msg.answer.split("\n").map((l, i) => (
          <text key={i} fg={msg.error ? C.red : C.cyan}>
            {(i === 0 ? "› " : "  ") + l}
          </text>
        ))}
      </box>
    )
  }

  const who = msg.role === "user" ? "you" : "z3r0"
  const whoColor = msg.role === "user" ? C.cyan : C.magenta
  const caret = streaming && tick % 2 === 0 ? "▌" : ""

  const reasoning = streaming && !msg.answer && !!msg.think.trim() // R1 still inside <think>
  const showReasoningBox = !!msg.think.trim() && (showThink || reasoning)
  const answerBody = msg.answer || (streaming && !reasoning ? "…" : "")

  return (
    <box style={{ flexDirection: "column", marginBottom: 1 }}>
      <text fg={whoColor}>{`▌ ${who}`}</text>

      {showReasoningBox ? (
        showThink ? (
          <box style={{ border: true, borderStyle: "rounded", borderColor: C.dim, paddingLeft: 1, paddingRight: 1 }}>
            <text fg={C.dim}>{msg.think.trim() + (reasoning ? caret : "")}</text>
          </box>
        ) : (
          <text fg={C.dim}>{`⠿ reasoning… (Ctrl+T to view) [${msg.think.trim().length} chars]${caret}`}</text>
        )
      ) : null}

      {answerBody ? (
        <text fg={msg.error ? C.red : C.text}>{answerBody + (streaming && !reasoning ? caret : "")}</text>
      ) : null}

      {msg.role === "assistant" && msg.label ? (
        <text fg={LABEL_COLOR[msg.label]}>{`[${msg.label}]`}</text>
      ) : null}
    </box>
  )
}
