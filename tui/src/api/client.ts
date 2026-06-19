import type { ModelKey } from "../types"

export interface StreamOpts {
  baseUrl: string
  apiKey: string
  model: ModelKey
  messages: { role: string; content: string }[]
  signal?: AbortSignal
}

/**
 * Stream an OpenAI-compatible chat completion from the Colab serve proxy.
 * Yields raw content deltas. SSE is parsed line-buffered so a `data:` line is
 * never split across two network chunks. The friendly model key is sent as-is —
 * the FastAPI proxy maps it to the real Ollama tag.
 */
export async function* streamChat(o: StreamOpts): AsyncGenerator<string> {
  const url = `${o.baseUrl.replace(/\/$/, "")}/v1/chat/completions`
  const res = await fetch(url, {
    method: "POST",
    signal: o.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${o.apiKey}`,
    },
    body: JSON.stringify({ model: o.model, messages: o.messages, stream: true }),
  })
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status} ${t.slice(0, 300)}`)
  }

  const dec = new TextDecoder()
  let buf = ""
  // Bun: res.body is an async-iterable ReadableStream of Uint8Array chunks.
  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    buf += dec.decode(chunk, { stream: true })
    let nl: number
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)
      if (!line.startsWith("data:")) continue
      const data = line.slice(5).trim()
      if (data === "[DONE]") return
      try {
        const j = JSON.parse(data)
        const delta: string = j?.choices?.[0]?.delta?.content ?? ""
        if (delta) yield delta
      } catch {
        /* keepalive or partial JSON — ignore */
      }
    }
  }
}
