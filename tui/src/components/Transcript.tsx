import type { Message } from "../types"
import { MessageView } from "./MessageView"

export function Transcript({
  messages,
  showThink,
  tick,
}: {
  messages: Message[]
  showThink: boolean
  tick: number
}) {
  return (
    <scrollbox style={{ flexGrow: 1, paddingLeft: 1, paddingRight: 1 }} stickyScroll stickyStart="bottom">
      {messages.map((m, i) => (
        <MessageView key={i} msg={m} showThink={showThink} streaming={!!m.streaming} tick={tick} />
      ))}
    </scrollbox>
  )
}
