import { mkdir, readdir } from "node:fs/promises"
import type { Message, ModelKey } from "../types"

// tui/sessions/ — this file is tui/src/lib/session.ts → ../../ = tui/
const DIR = new URL("../../sessions/", import.meta.url).pathname

export interface Session {
  id: string
  createdAt: string
  model: ModelKey
  messages: Message[]
}
export interface SessionMeta {
  id: string
  createdAt: string
  model: string
  count: number
}

/** Filesystem-safe id from an ISO timestamp, e.g. 2026-06-19T14-02-33-123Z */
export const sessionId = (iso: string): string => iso.replace(/[:.]/g, "-")

export async function saveSession(s: Session): Promise<string> {
  await mkdir(DIR, { recursive: true })
  const path = `${DIR}${s.id}.json`
  await Bun.write(path, JSON.stringify(s, null, 2))
  return `sessions/${s.id}.json`
}

export async function listSessions(): Promise<SessionMeta[]> {
  let files: string[]
  try {
    files = (await readdir(DIR)).filter((f) => f.endsWith(".json"))
  } catch {
    return []
  }
  const metas: SessionMeta[] = []
  for (const f of files) {
    try {
      const s = (await Bun.file(`${DIR}${f}`).json()) as Session
      metas.push({ id: s.id, createdAt: s.createdAt, model: s.model, count: s.messages.length })
    } catch {
      /* skip unreadable */
    }
  }
  metas.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return metas
}

export async function loadSession(id: string): Promise<Session | null> {
  try {
    return (await Bun.file(`${DIR}${id}.json`).json()) as Session
  } catch {
    return null
  }
}
