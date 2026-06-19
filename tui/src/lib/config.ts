import type { Config, ModelKey } from "../types"
import { MODELS } from "../types"

// tui/z3r0.config.json (this file lives at tui/src/lib/config.ts → ../../ = tui/)
const FILE = new URL("../../z3r0.config.json", import.meta.url).pathname

function coerceModel(v: unknown): ModelKey {
  return MODELS.includes(v as ModelKey) ? (v as ModelKey) : "control"
}

/** Precedence: config file > env vars > defaults. (In-app edits are written back to the file.) */
export async function loadConfig(): Promise<Config> {
  let file: Partial<Config> = {}
  try {
    file = (await Bun.file(FILE).json()) as Partial<Config>
  } catch {
    /* no config file yet — fall back to env/defaults */
  }
  return {
    baseUrl: file.baseUrl ?? Bun.env.Z3R0_BASE_URL ?? "",
    apiKey: file.apiKey ?? Bun.env.Z3R0_API_KEY ?? "",
    model: coerceModel(file.model ?? Bun.env.Z3R0_MODEL),
  }
}

export function saveConfig(c: Config): Promise<number> {
  return Bun.write(FILE, JSON.stringify(c, null, 2) + "\n")
}
