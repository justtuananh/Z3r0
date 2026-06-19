import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./App"

const renderer = await createCliRenderer({ exitOnCtrlC: true })

function quit(): void {
  const r = renderer as unknown as { destroy?: () => void; stop?: () => void }
  try {
    if (typeof r.destroy === "function") r.destroy()
    else if (typeof r.stop === "function") r.stop()
  } catch {
    /* ignore teardown errors */
  }
  process.exit(0)
}

createRoot(renderer).render(<App quit={quit} />)
