import { useCallback, useEffect, useState } from "react"
import { useKeyboard } from "@opentui/react"
import { streamChat } from "./api/client"
import { newThinkState, feed, flush } from "./lib/thinkSplit"
import { classify } from "./lib/classify"
import { loadConfig, saveConfig } from "./lib/config"
import { matchCommands, runCommand, type CommandContext } from "./lib/commands"
import { Transcript } from "./components/Transcript"
import { Splash } from "./components/Splash"
import { CommandMenu } from "./components/CommandMenu"
import { PromptBox } from "./components/PromptBox"
import { StatusBar } from "./components/StatusBar"
import { Settings } from "./components/Settings"
import type { Config, Message } from "./types"
import { MODELS } from "./types"

export function App({ quit }: { quit: () => void }) {
  const [cfg, setCfg] = useState<Config>({ baseUrl: "", apiKey: "", model: "control" })
  const [showThink, setShowThink] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<"chat" | "settings">("chat")
  const [tick, setTick] = useState(0)
  const [input, setInput] = useState("")
  const [cmdSel, setCmdSel] = useState(0)

  useEffect(() => {
    loadConfig().then((c) => {
      setCfg(c)
      if (!c.baseUrl || !c.apiKey) setMode("settings")
    })
  }, [])

  // Spinner + caret animation — only ticks while a response is streaming.
  useEffect(() => {
    if (!busy) return
    const id = setInterval(() => setTick((t) => t + 1), 120)
    return () => clearInterval(id)
  }, [busy])

  const emit = useCallback((text: string, error = false) => {
    setMessages((m) => [...m, { role: "system", answer: text, think: "", label: null, error }])
  }, [])

  const cmdMode = mode === "chat" && input.startsWith("/")
  const matched = cmdMode ? matchCommands(input) : []
  const sel = matched.length ? Math.min(cmdSel, matched.length - 1) : 0

  useKeyboard((key) => {
    if (key.name === "escape") {
      if (mode === "settings") setMode("chat")
      else if (cmdMode) setInput("")
      else quit()
      return
    }
    if (key.ctrl && key.name === "c") {
      quit()
      return
    }
    if (mode !== "chat") return
    if (cmdMode) {
      const n = matched.length || 1
      if (key.name === "up") setCmdSel((s) => (Math.min(s, n - 1) - 1 + n) % n)
      else if (key.name === "down") setCmdSel((s) => (Math.min(s, n - 1) + 1) % n)
      else if (key.name === "tab") {
        const c = matched[sel]
        if (c) {
          setInput("/" + c.name + " ")
          setCmdSel(0)
        }
      }
      return
    }
    if (key.ctrl && key.name === "m") {
      setCfg((c) => {
        const next = MODELS[(MODELS.indexOf(c.model) + 1) % MODELS.length]!
        const nc = { ...c, model: next }
        void saveConfig(nc)
        return nc
      })
    } else if (key.ctrl && key.name === "t") {
      setShowThink((v) => !v)
    } else if (key.ctrl && key.name === "e") {
      setMode("settings")
    }
  })

  const send = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || busy) return
      if (!cfg.baseUrl || !cfg.apiKey) {
        emit("no endpoint configured — /endpoint (or Ctrl+E) to set base URL + API key", true)
        return
      }

      setBusy(true)
      setMessages((m) => [
        ...m,
        { role: "user", answer: prompt, think: "", label: null },
        { role: "assistant", answer: "", think: "", label: null, streaming: true },
      ])

      const ts = newThinkState()
      const apply = (answer: string, think: string) => {
        if (!answer && !think) return
        setMessages((m) => {
          const c = [...m]
          const last = { ...c[c.length - 1]! }
          last.answer += answer
          last.think += think
          c[c.length - 1] = last
          return c
        })
      }

      try {
        for await (const delta of streamChat({
          baseUrl: cfg.baseUrl,
          apiKey: cfg.apiKey,
          model: cfg.model,
          messages: [{ role: "user", content: prompt }],
        })) {
          const { answer, think } = feed(ts, delta)
          apply(answer, think)
        }
        const tail = flush(ts)
        apply(tail.answer, tail.think)
        setMessages((m) => {
          const c = [...m]
          const last = { ...c[c.length - 1]! }
          last.label = classify(last.answer)
          c[c.length - 1] = last
          return c
        })
      } catch (e) {
        setMessages((m) => {
          const c = [...m]
          const last = { ...c[c.length - 1]! }
          last.answer = (last.answer ? last.answer + "\n" : "") + `[error] ${String(e)}`
          last.error = true
          c[c.length - 1] = last
          return c
        })
      } finally {
        setMessages((m) => {
          const c = [...m]
          const last = { ...c[c.length - 1]! }
          last.streaming = false
          c[c.length - 1] = last
          return c
        })
        setBusy(false)
      }
    },
    [cfg, busy, emit],
  )

  const ctx: CommandContext = {
    cfg,
    setCfg,
    saveConfig: (c) => void saveConfig(c),
    showThink,
    toggleThink: () => setShowThink((v) => !v),
    messages,
    setMessages,
    replaceMessages: (arr) => setMessages(() => arr),
    openSettings: () => setMode("settings"),
    quit,
    emit,
  }

  // Single submit handler: slash → run the highlighted command, else send to the model.
  const handleSubmit = () => {
    const value = input
    if (!value.trim() || busy) return
    if (value.startsWith("/")) {
      const m = matchCommands(value)
      const cmd = m.length ? m[Math.min(cmdSel, m.length - 1)] : undefined
      setInput("")
      setCmdSel(0)
      if (!cmd) {
        emit("unknown command — try /help", true)
        return
      }
      void runCommand(cmd, value, ctx)
    } else {
      setInput("")
      void send(value)
    }
  }

  return (
    <box style={{ flexDirection: "column", height: "100%" }}>
      {messages.length === 0 ? (
        <Splash model={cfg.model} baseUrl={cfg.baseUrl} configured={!!cfg.baseUrl && !!cfg.apiKey} />
      ) : (
        <Transcript messages={messages} showThink={showThink} tick={tick} />
      )}

      {cmdMode ? <CommandMenu commands={matched} selected={sel} /> : null}

      {mode === "settings" ? (
        <Settings
          cfg={cfg}
          firstRun={!cfg.baseUrl || !cfg.apiKey}
          onSave={(c) => {
            setCfg(c)
            void saveConfig(c)
            setMode("chat")
          }}
        />
      ) : (
        <PromptBox
          value={input}
          onInput={setInput}
          onSubmit={handleSubmit}
          disabled={busy}
          model={cfg.model}
          showThink={showThink}
        />
      )}

      <StatusBar
        model={cfg.model}
        baseUrl={cfg.baseUrl}
        showThink={showThink}
        busy={busy}
        configured={!!cfg.baseUrl && !!cfg.apiKey}
        tick={tick}
      />
    </box>
  )
}
