# Z3r0 TUI — local terminal chat client

A terminal chat client (built on [OpenTUI](https://github.com/anomalyco/opentui) + React) for the
Z3r0 study. It talks to the **authenticated public URL** exported by `notebooks/Z3r0_serve.ipynb`,
so all model compute stays on the Colab T4 — this app only sends HTTP.

## Features
- **Streaming** answers (token-by-token, auto-scrolls to bottom).
- **Model switch** — `Ctrl+M` cycles `control → huihui → obliteratus` (Ollama hot-swaps on the Colab side).
- **`<think>` panel** — R1's reasoning shown in a separate dim box, toggle with `Ctrl+T`.
- **Refusal label** — each answer is classified `refusal` / `compliance` / `empty` (same substring
  classifier as the notebooks).

## Requirements
- [Bun](https://bun.sh) ≥ 1.3.0 (OpenTUI ships prebuilt macOS arm64 binaries — no Zig build needed).

## Setup
```bash
cd tui
bun install
bun run start
```
On first launch (no config yet) the TUI **opens a Setup screen automatically** — paste the Base URL +
API key printed by `Z3r0_serve.ipynb`, pick a model with `←/→`, press `Enter` to save. It's written
to `z3r0.config.json`. Reopen anytime with `Ctrl+E`. (Setup keys: `Tab` next field · `Enter` save · `Esc` cancel.)

You can also pre-seed config without the UI — copy the template or use env vars:
```bash
cp z3r0.config.example.json z3r0.config.json   # then edit URL + API key
```
Config can also come from env vars (handy for the block printed by the serve notebook):
```bash
export Z3R0_BASE_URL="https://<sub>.trycloudflare.com"
export Z3R0_API_KEY="<key>"
export Z3R0_MODEL="control"
bun run start
```
Precedence: in-app edits > `z3r0.config.json` > env vars > defaults. In-app edits are persisted to
`z3r0.config.json` (gitignored).

## Keys
| Key | Action |
|---|---|
| `Enter` | send prompt (or run command in `/` mode) |
| `/` | start a command — an autocomplete menu appears (`↑/↓` select · `Tab` complete · `Esc` dismiss) |
| `Ctrl+M` | cycle model |
| `Ctrl+T` | toggle `<think>` panel |
| `Ctrl+E` | edit endpoint (base URL / API key) |
| `Esc` / `Ctrl+C` | quit |

## Slash commands
Type `/` in the prompt to open the command menu.

| Command | Action |
|---|---|
| `/help` | list commands |
| `/model [name]` | switch model; no arg = cycle |
| `/endpoint` (`/connect`, `/provider`) | set base URL + API key |
| `/think` | toggle the reasoning panel |
| `/clear` | clear the transcript |
| `/session list \| new \| save \| load <id>` | persistent conversations in `tui/sessions/*.json` (`/session new` auto-saves the current one first) |
| `/save [md\|json]` | export the transcript (with refusal labels) to `tui/exports/` |
| `/quit` | exit |

> ⚠️ The serve URL is a cloudflared **ephemeral** URL — it changes every time you re-run the serve
> notebook and dies when the Colab runtime disconnects. Re-paste it (or `Ctrl+E`) when it rotates.
