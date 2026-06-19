import { accentFor, markerFor } from "../lib/theme"

// Controlled by App: App owns the input value so it can detect "/" command mode.
export function PromptBox({
  value,
  onInput,
  onSubmit,
  disabled,
  model,
  showThink,
}: {
  value: string
  onInput: (s: string) => void
  onSubmit: () => void
  disabled: boolean
  model: string
  showThink: boolean
}) {
  const accent = accentFor(model)
  const cmd = value.startsWith("/")
  return (
    <box
      title={`prompt · ${markerFor(model)} ${model} · think:${showThink ? "on" : "off"}`}
      style={{ border: true, borderColor: cmd ? "#54f2f2" : accent, height: 3 }}
    >
      <input
        value={value}
        placeholder={disabled ? "waiting for response…" : "Ask the model…  ( / for commands )"}
        focused={!disabled}
        onInput={onInput}
        onSubmit={() => {
          if (!disabled) onSubmit()
        }}
      />
    </box>
  )
}
