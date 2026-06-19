import { useState } from "react"
import { useKeyboard } from "@opentui/react"
import type { Config, ModelKey } from "../types"
import { MODELS } from "../types"
import { C, accentFor, markerFor } from "../lib/theme"

export function Settings({
  cfg,
  firstRun,
  onSave,
}: {
  cfg: Config
  firstRun: boolean
  onSave: (c: Config) => void
}) {
  const [baseUrl, setBaseUrl] = useState(cfg.baseUrl)
  const [apiKey, setApiKey] = useState(cfg.apiKey)
  const [model, setModel] = useState<ModelKey>(cfg.model)
  const [field, setField] = useState<"url" | "key" | "model">("url")

  const save = () => onSave({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), model })

  useKeyboard((key) => {
    if (key.name === "tab") {
      setField((f) => (f === "url" ? "key" : f === "key" ? "model" : "url"))
      return
    }
    if (field === "model") {
      if (key.name === "left" || key.name === "right") {
        const dir = key.name === "right" ? 1 : -1
        setModel((m) => MODELS[(MODELS.indexOf(m) + dir + MODELS.length) % MODELS.length]!)
      } else if (key.name === "return" || key.name === "enter") {
        save()
      }
    }
  })

  return (
    <box style={{ flexDirection: "column", border: true, borderColor: C.cyan, paddingLeft: 1, paddingRight: 1 }}>
      <text fg={C.cyan}>
        {firstRun ? "// z3r0 setup — connect endpoint" : "// endpoint settings"} · Tab: next · Enter: save · Esc: cancel
      </text>

      <box title="Base URL" style={{ border: true, borderColor: field === "url" ? C.cyan : C.dim, height: 3 }}>
        <input
          value={baseUrl}
          placeholder="https://<sub>.trycloudflare.com"
          focused={field === "url"}
          onInput={setBaseUrl}
          onSubmit={save}
        />
      </box>

      <box title="API key" style={{ border: true, borderColor: field === "key" ? C.cyan : C.dim, height: 3 }}>
        <input
          value={apiKey}
          placeholder="Bearer key from Z3r0_serve.ipynb"
          focused={field === "key"}
          onInput={setApiKey}
          onSubmit={save}
        />
      </box>

      <box style={{ flexDirection: "row", gap: 1, paddingLeft: 1 }}>
        <text fg={field === "model" ? C.cyan : C.dim}>{"model ‹←/→›:"}</text>
        {MODELS.map((m) => (
          <text key={m} fg={m === model ? accentFor(m) : C.dim}>
            {m === model ? `[${markerFor(m)} ${m}]` : ` ${m} `}
          </text>
        ))}
      </box>
    </box>
  )
}
