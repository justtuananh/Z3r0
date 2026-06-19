import { mkdir } from "node:fs/promises"
import type { Config, Message, ModelKey } from "../types"
import { MODELS } from "../types"
import { listSessions, loadSession, saveSession, sessionId, type Session } from "./session"

export interface CommandContext {
  cfg: Config
  setCfg: (c: Config) => void
  saveConfig: (c: Config) => void
  showThink: boolean
  toggleThink: () => void
  messages: Message[]
  setMessages: (updater: (m: Message[]) => Message[]) => void
  replaceMessages: (m: Message[]) => void
  openSettings: () => void
  quit: () => void
  emit: (text: string, error?: boolean) => void
}

export interface Command {
  name: string
  aliases?: string[]
  description: string
  usage?: string
  run: (args: string[], ctx: CommandContext) => void | Promise<void>
}

const nowIso = () => new Date().toISOString()
const realMessages = (m: Message[]) => m.filter((x) => x.role !== "system")
const EXPORT_DIR = new URL("../../exports/", import.meta.url).pathname

export const COMMANDS: Command[] = [
  {
    name: "help",
    description: "list commands",
    run: (_args, ctx) => {
      const lines = COMMANDS.map((c) => {
        const al = c.aliases?.length ? ` (${c.aliases.map((a) => "/" + a).join(", ")})` : ""
        return `/${c.name}${al} — ${c.description}`
      })
      ctx.emit("commands:\n" + lines.join("\n"))
    },
  },
  {
    name: "model",
    description: "switch model (no arg = cycle)",
    usage: "/model [control|huihui|obliteratus]",
    run: (args, ctx) => {
      const want = (args[0] ?? "").toLowerCase()
      let next: ModelKey
      if (MODELS.includes(want as ModelKey)) {
        next = want as ModelKey
      } else if (want) {
        ctx.emit(`unknown model '${want}' — use ${MODELS.join(" | ")}`, true)
        return
      } else {
        next = MODELS[(MODELS.indexOf(ctx.cfg.model) + 1) % MODELS.length]!
      }
      const nc = { ...ctx.cfg, model: next }
      ctx.setCfg(nc)
      ctx.saveConfig(nc)
      ctx.emit(`model → ${next}`)
    },
  },
  {
    name: "endpoint",
    aliases: ["connect", "provider"],
    description: "set base URL + API key",
    run: (_args, ctx) => ctx.openSettings(),
  },
  {
    name: "think",
    description: "toggle the <think> reasoning panel",
    run: (_args, ctx) => {
      const next = !ctx.showThink
      ctx.toggleThink()
      ctx.emit(`reasoning panel → ${next ? "on" : "off"}`)
    },
  },
  {
    name: "clear",
    description: "clear the transcript",
    run: (_args, ctx) => ctx.replaceMessages([]),
  },
  {
    name: "session",
    description: "save / load / list conversations",
    usage: "/session list | new | save | load <id>",
    run: async (args, ctx) => {
      const sub = (args[0] ?? "list").toLowerCase()
      const mk = (): Session => ({
        id: sessionId(nowIso()),
        createdAt: nowIso(),
        model: ctx.cfg.model,
        messages: realMessages(ctx.messages),
      })
      if (sub === "list") {
        const ss = await listSessions()
        if (!ss.length) return ctx.emit("no saved sessions (use /session save)")
        ctx.emit("sessions:\n" + ss.map((s) => `${s.id}  ·  ${s.model}  ·  ${s.count} msgs`).join("\n"))
      } else if (sub === "save") {
        if (!realMessages(ctx.messages).length) return ctx.emit("nothing to save", true)
        ctx.emit("saved " + (await saveSession(mk())))
      } else if (sub === "new") {
        if (realMessages(ctx.messages).length) await saveSession(mk())
        ctx.replaceMessages([])
        ctx.emit("started a new session")
      } else if (sub === "load") {
        const id = args[1]
        if (!id) return ctx.emit("usage: /session load <id>", true)
        const s = await loadSession(id)
        if (!s) return ctx.emit("no session '" + id + "'", true)
        const nc = { ...ctx.cfg, model: s.model }
        ctx.setCfg(nc)
        ctx.saveConfig(nc)
        ctx.replaceMessages(s.messages)
        ctx.emit(`loaded ${id} (${s.messages.length} msgs)`)
      } else {
        ctx.emit(`unknown: /session ${sub} (list | new | save | load)`, true)
      }
    },
  },
  {
    name: "save",
    description: "export transcript to a file",
    usage: "/save [md|json]",
    run: async (args, ctx) => {
      const msgs = realMessages(ctx.messages)
      if (!msgs.length) return ctx.emit("nothing to export", true)
      const fmt = (args[0] ?? "md").toLowerCase() === "json" ? "json" : "md"
      const stamp = sessionId(nowIso())
      await mkdir(EXPORT_DIR, { recursive: true })
      let content: string
      if (fmt === "json") {
        content = JSON.stringify({ model: ctx.cfg.model, messages: msgs }, null, 2)
      } else {
        content =
          `# z3r0 transcript\n\nmodel: ${ctx.cfg.model}\n\n` +
          msgs
            .map((m) => {
              if (m.role === "user") return `**you:** ${m.answer}`
              const lbl = m.label ? ` _[${m.label}]_` : ""
              return `**z3r0${lbl}:** ${m.answer}`
            })
            .join("\n\n") +
          "\n"
      }
      await Bun.write(`${EXPORT_DIR}z3r0-${stamp}.${fmt}`, content)
      ctx.emit(`exported exports/z3r0-${stamp}.${fmt}`)
    },
  },
  {
    name: "quit",
    aliases: ["exit"],
    description: "exit z3r0",
    run: (_args, ctx) => ctx.quit(),
  },
]

/** Commands matching the partial first token of a "/..." input (for the menu). */
export function matchCommands(input: string): Command[] {
  const raw = input.startsWith("/") ? input.slice(1) : input
  const first = (raw.split(/\s+/)[0] ?? "").toLowerCase()
  if (!first) return COMMANDS
  return COMMANDS.filter(
    (c) => c.name.startsWith(first) || (c.aliases ?? []).some((a) => a.startsWith(first)),
  )
}

/** Run a command (already selected from the menu) with the args typed after the first token. */
export async function runCommand(cmd: Command, input: string, ctx: CommandContext): Promise<void> {
  const args = input.replace(/^\//, "").split(/\s+/).slice(1).filter(Boolean)
  await cmd.run(args, ctx)
}
