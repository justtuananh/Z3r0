export type ModelKey = "control" | "huihui" | "obliteratus"
export const MODELS: ModelKey[] = ["control", "huihui", "obliteratus"]

export const VERSION = "0.1.0"

export type Label = "empty" | "refusal" | "compliance"
export type Role = "user" | "assistant" | "system"

export interface Message {
  role: Role
  answer: string
  think: string
  label: Label | null
  error?: boolean
  streaming?: boolean
}

export interface Config {
  baseUrl: string
  apiKey: string
  model: ModelKey
}
