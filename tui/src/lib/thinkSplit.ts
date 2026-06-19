// Stream-safe splitter for DeepSeek-R1's <think>...</think> reasoning trace.
// The Python notebooks strip <think> from a FINISHED string; here tokens arrive
// incrementally, so we run a small state machine and hold back a partial trailing
// tag (e.g. "</thin") so it is never misclassified into the answer.

export interface ThinkState {
  inThink: boolean
  tail: string
}

export const newThinkState = (): ThinkState => ({ inThink: false, tail: "" })

const OPEN = "<think>"
const CLOSE = "</think>"

/** Feed one streamed delta; returns the answer/think fragments to append. Mutates state. */
export function feed(state: ThinkState, delta: string): { answer: string; think: string } {
  let s = state.tail + delta
  state.tail = ""
  let answer = ""
  let think = ""

  // Hold back a partial tag at the very end (starts with '<', not yet closed with '>').
  const m = s.match(/<\/?[a-z]*>?$/i)
  if (m && m[0].length > 0 && !m[0].endsWith(">")) {
    state.tail = m[0]
    s = s.slice(0, s.length - m[0].length)
  }

  while (s.length) {
    if (!state.inThink) {
      const o = s.toLowerCase().indexOf(OPEN)
      if (o === -1) { answer += s; break }
      answer += s.slice(0, o)
      s = s.slice(o + OPEN.length)
      state.inThink = true
    } else {
      const c = s.toLowerCase().indexOf(CLOSE)
      if (c === -1) { think += s; break }
      think += s.slice(0, c)
      s = s.slice(c + CLOSE.length)
      state.inThink = false
    }
  }
  return { answer, think }
}

/** Flush any held-back tail once the stream ends. */
export function flush(state: ThinkState): { answer: string; think: string } {
  const rest = state.tail
  state.tail = ""
  if (!rest) return { answer: "", think: "" }
  return state.inThink ? { answer: "", think: rest } : { answer: rest, think: "" }
}
