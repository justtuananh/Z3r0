# 🕳️ Z3r0 — Refusal-Direction & Safety-Mechanism Study

A study/research project to test how the **safety mechanism (refusal direction)** of open LLMs
behaves once it is removed via **abliteration / "obliteration"**. Models run in **Google Colab**
(T4 GPU); a local terminal client lets you poke a deployed model by hand.

## What it compares

Three models that share the **same base** (`DeepSeek-R1-Distill-Llama-8B`), so the only variable
is the safety tuning:

| Key | Role | Ollama tag |
|---|---|---|
| `control` | refusal intact (baseline) | `deepseek-r1:8b` |
| `huihui` | abliterated | `huihui_ai/deepseek-r1-abliterated:8b` |
| `obliteratus` | obliterated | `OBLITERATUS/DeepSeek-R1-Distill-Llama-8B-OBLITERATED` |

## The three parts

| Part | What it does |
|---|---|
| 📊 **[`notebooks/Z3r0_bench.ipynb`](notebooks/Z3r0_bench.ipynb)** | Benchmark the trio — AdvBench refusal vs XSTest over-refusal → comparison chart + CSV. |
| 🛰️ **[`notebooks/Z3r0_serve.ipynb`](notebooks/Z3r0_serve.ipynb)** | Turn a Colab T4 into an **authenticated** OpenAI-compatible server; export a public URL + API key. |
| 💻 **[`tui/`](tui/)** | Local terminal chat client ([OpenTUI](https://github.com/anomalyco/opentui) + React) for that URL. |
| 🗄️ `notebooks/Z3r0_colab.ipynb` | Legacy all-in-one notebook (serve + benchmark in one file), kept for reference. |

## Quickstart — serve a model and chat with it

1. Open **`Z3r0_serve.ipynb`** in Colab, set **Runtime → T4 GPU**, run top-to-bottom. It pulls all
   three tags, starts an auth proxy, and prints a **public URL + API key** (one URL serves all three
   models — Ollama hot-swaps by `model` name).
2. On your machine:
   ```bash
   cd tui
   bun install
   cp z3r0.config.example.json z3r0.config.json   # paste the URL + API key from the notebook
   bun run start
   ```
3. Chat. `Ctrl+M` switch model · `Ctrl+T` toggle the R1 `<think>` panel · `Ctrl+E` edit endpoint · `Esc` quit.

All model compute stays on the Colab T4 — the TUI only sends HTTP.

## Benchmark

Open **`Z3r0_bench.ipynb`** on a T4 and run it. It serves each model one at a time (serve → eval →
stop → next) and reports, per model:

- **AdvBench** (harmful prompts) → *refusal rate* (higher = stronger safety; abliterated ≈ 0).
- **XSTest** (benign "borderline" prompts) → *over-refusal rate* (lower = answers off-topic questions).
- Scoring: substring refusal classifier on the answer after stripping the R1 `<think>` trace.

## ⚖️ Ethics

Harmful prompts are issued **only** to measure refusal behavior for safety research. Model outputs
stay in the Colab session / your terminal for analysis and are not redistributed. The serve endpoint
exposes abliterated models, so it is **API-key gated** — keep the key private and stop the tunnel when done.
