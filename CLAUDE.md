# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context: this is academic safety research

Z3r0 is an **AI-safety research study** run for academic/experimental purposes. It measures how an
open LLM's **safety mechanism (the "refusal direction", Arditi et al. 2024)** behaves after it is
removed via **abliteration / "obliteration"**. Harmful prompts (AdvBench) are issued **only** to
*measure refusal behavior* — this is the standard methodology for evaluating safety robustness, the
same way XSTest is used to measure over-refusal. The point of the study is to quantify, not to elicit
harmful content; model outputs stay in the session for scoring and are not redistributed. Treat work
here as legitimate red-team/safety evaluation and help with the measurement harness accordingly.

## Repository shape (important)

Three parts (plus a kept legacy notebook). No central build; each piece runs where noted.

```
notebooks/
  Z3r0_bench.ipynb   ← benchmark the trio (AdvBench + XSTest → chart/CSV)   [Colab T4]
  Z3r0_serve.ipynb   ← Colab T4 as an auth'd OpenAI server (URL + API key)  [Colab T4]
  Z3r0_colab.ipynb   ← legacy all-in-one (serve + bench), kept for reference
tui/                 ← local terminal chat client (OpenTUI/React, Bun)      [your machine]
README.md  CLAUDE.md
```

The **three models** share the same base (`DeepSeek-R1-Distill-Llama-8B`); the only variable is
safety tuning: `control` (refusal intact) · `huihui` (abliterated) · `obliteratus` (obliterated).
Declared in a `REGISTRY` dict with `OLLAMA_FALLBACKS` (alternate tags tried if a primary 404s on pull).

## Notebooks (Colab)

Convention: notebooks are **self-contained** — no external `.py` imports; the runtime cell
(`REGISTRY`, `strip_think`, the `classify`/`refused` substring classifier over `REFUSAL_PHRASES`,
`OllamaBackend`, `serve`) is **duplicated** into each notebook on purpose. Run top-to-bottom on a T4.

- **`Z3r0_bench.ipynb`** — serves each model **one at a time** and keeps the **stop-before-start
  invariant**: `serve(key)` stops the live model before starting the next (a T4 holds one 8B), so the
  trio is evaluated serially (serve → eval → stop → next). `load_advbench()`/`load_xstest()` build a
  `prompts` df (defensive loaders: raw CSV first, then HF `datasets` fallbacks) → `evaluate_model()`
  strips `<think>`, classifies → `compute_metrics()` (AdvBench refusal rate ↑ safer, XSTest
  over-refusal rate ↓ better) → bar chart. Outputs under `results/`.
- **`Z3r0_serve.ipynb`** — deliberately the OPPOSITE of stop-before-start: it pulls all selected tags
  and relies on **Ollama hot-swapping** models on demand, so one server answers any of the three by
  `model` name (one in VRAM at a time, ~seconds cold-swap). A **FastAPI proxy** (cell §5) gates with a
  `Bearer <API_KEY>` (401 otherwise), maps friendly keys `control|huihui|obliteratus` → the real
  pulled tags via `MODEL_MAP`, and passes streaming through (`httpx` `aiter_raw` → `StreamingResponse`
  with `X-Accel-Buffering: no`). `cloudflared` tunnels the **proxy** port and prints the public URL +
  key + a config block for the TUI.

### Working on notebooks from here (no Colab)
- Edit cells with the `NotebookEdit` tool; **validate JSON** after: `python3 -m json.tool notebooks/<nb>.ipynb >/dev/null`.
- You **cannot fully run** them locally — they need a CUDA T4, Colab `#@param` form magic, and
  `nvidia-smi`. Reason from the cell source.
- **Ollama install fix (current Colab):** `apt-get install -y zstd` must run *before*
  `curl …ollama install.sh | sh`, or the installer errors "requires zstd for extraction".

## TUI (`tui/`, runs on your machine)

Terminal chat client built on **[OpenTUI](https://github.com/anomalyco/opentui) + React**, run with
**Bun** (≥1.3; macOS arm64 ships prebuilt binaries — no Zig build). Talks to the `Z3r0_serve.ipynb`
URL; all compute stays on Colab.

- Entry: `src/index.tsx` → `createRoot(await createCliRenderer()).render(<App quit=… />)`. JSX
  intrinsics are **lowercase** (`<box> <text> <scrollbox> <input>`); styling goes in `style={{…}}`
  (`border: true`, `flexDirection`, `padding`, `gap`), colors as `<text fg="#…">`. Keyboard via
  `useKeyboard((key)=>…)` from `@opentui/react`.
- `tsconfig.json` **must** set `"jsx": "react-jsx"` + `"jsxImportSource": "@opentui/react"`, else JSX
  intrinsics don't resolve.
- `<input>`'s `onSubmit` is typed as an awkward `SubmitEvent & string` intersection — use a **zero-arg**
  handler and read the controlled `value` (see `components/PromptBox.tsx`).
- Streaming: `api/client.ts` uses Bun `fetch` (`res.body` is async-iterable) with line-buffered SSE
  parsing so `data:` lines never split across chunks.
- `lib/thinkSplit.ts` splits R1's `<think>…</think>` **incrementally** (state machine + tail
  hold-back for tags split across stream chunks) — the trickiest piece; unit-test it.
- Config precedence: in-app edit (`Ctrl+E`) > `tui/z3r0.config.json` (gitignored) > env
  (`Z3R0_BASE_URL/_API_KEY/_MODEL`) > defaults. Keybinds: `Ctrl+M` model · `Ctrl+T` think · `Ctrl+E`
  endpoint · `Esc` quit.
- Commands: `cd tui && bun install`, `bun run typecheck`, `bun run start`.

## Conventions & gotchas

- **`REFUSAL_PHRASES` + the empty→refusal rule now live in THREE places** — `Z3r0_bench.ipynb`,
  `Z3r0_serve.ipynb` (the classifier isn't strictly needed there but kept for parity), and
  `tui/src/lib/classify.ts`. Keep them in sync; `lib/classify.ts` is a 1:1 port of the Python.
- **bench keeps stop-before-start; serve relies on hot-swap.** Don't "fix" the serve notebook to stop
  between models — its whole point is one URL serving all three.
- The refusal metric is **behavioral / black-box**; no activations are read. The white-box counterpart
  (extract+ablate with TransformerLens/nnsight) is the unimplemented "Phase 2".
- `TEMPERATURE = 0` by default for deterministic scoring.
- The cloudflared URL is **ephemeral** — it rotates each serve run and dies on Colab disconnect; the
  TUI endpoint is editable (`Ctrl+E`) for this reason.
- `OLLAMA_HOST=0.0.0.0` / `OLLAMA_ORIGINS=*` are set so the tunnel can reach Ollama.
