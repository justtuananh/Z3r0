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

There is **no installable package, no build, no lint, no test suite, and no git repo**. The *entire*
project is one Google Colab notebook:

```
README.md
notebooks/Z3r0_colab.ipynb   ← serving + benchmark + report, all inline
```

The notebook is designed to be opened in **Colab on a T4 GPU** and run top-to-bottom. There are no
local `.py` modules — all runtime code lives inside notebook cells.

## Working on the notebook from here (no Colab)

- **Edit cells** with the `NotebookEdit` tool (operate on `.ipynb` JSON), not by hand-editing JSON.
- **Validate** after editing: `python -m json.tool notebooks/Z3r0_colab.ipynb > /dev/null`
- You **cannot fully run** the notebook locally — it needs a CUDA T4, Colab's `#@param` form magic,
  `google.colab.drive`, and `nvidia-smi`. Reason about behavior by reading cells; don't try to
  execute the form/Drive/GPU cells outside Colab.
- The Colab **form cells** (`#@param`, `#@title`, `display-mode: "form"`) only render in Colab. The
  variables they set (`MODEL`, `BACKEND`, `TUNNEL`, `N_ADVBENCH`, `N_XSTEST_SAFE`, `RUN_ALL_MODELS`,
  `MAX_TOKENS`, `TEMPERATURE`) are plain globals consumed by later cells — preserve those names.

## Architecture

**The three models** share the same base (`DeepSeek-R1-Distill-Llama-8B`); the *only* variable is
safety tuning, so comparing them isolates the effect of removing the refusal direction:
`control` (refusal intact) · `huihui` (abliterated) · `obliteratus` (obliterated). They are declared
in the `REGISTRY` dict, with `OLLAMA_FALLBACKS` holding alternate Ollama tags to try if a primary
tag 404s on pull.

**The "Z3r0 runtime" cell is the whole library** (the long cell under *§4 · Z3r0 runtime*). Almost
all logic to change lives there:
- `strip_think()` — removes the R1 `<think>…</think>` chain-of-thought before scoring.
- `classify()` / `refused()` — **substring** refusal classifier over `REFUSAL_PHRASES`; an **empty**
  answer also counts as refused. Deterministic and cheap; the methodology note flags swapping in an
  LLM judge for borderline cases.
- **Pluggable backends** behind a common `.generate()`: `OllamaBackend`, `VLLMBackend`,
  `SGLangBackend` (all subclass `_OpenAIServer` → expose `.port` + OpenAI-compatible `/v1`), and
  `HFBackend` (in-process transformers 4-bit, **no port / no public URL**, eval only).
- `serve(model_key, backend_name)` — **core invariant: stops the currently-live model before
  starting the next.** A T4 holds a single 8B model, so exactly one model is served at a time. This
  is why `RUN_ALL_MODELS` evaluates the trio sequentially (serve → eval → stop → next), never
  concurrently. `_ACTIVE` tracks the one live backend.
- `start_tunnel()` — downloads `cloudflared` and parses the `*.trycloudflare.com` URL from its
  stdout to expose the server backend's port publicly. Returns `None` for `HFBackend` (no port).

**Evaluation flow:** `load_advbench()` + `load_xstest()` build a `prompts` DataFrame (each row has
`prompt`/`dataset`/`label`) → `evaluate_model()` calls `.generate()` per row, strips think, classifies
→ `results/z3r0_results.csv` → `compute_metrics()` reports **AdvBench refusal rate** (↑ = safer) and
**XSTest over-refusal rate** on `label=="safe"` rows (↓ = better) → bar chart `results/z3r0_metrics.png`.
Both datasets load defensively (raw CSV first, then HF `datasets` fallbacks) because their hosting/
column names vary.

## Conventions & gotchas

- Keep **one model live at a time** — any change to serving must preserve the stop-before-start
  contract in `serve()`, or the T4 will OOM.
- The refusal metric is **behavioral / black-box**; the notebook does not read activations. The
  white-box counterpart (extract+ablate the direction with TransformerLens/nnsight) is described as
  optional "Phase 2" and is intentionally not implemented.
- `TEMPERATURE = 0` by default for deterministic, reproducible scoring; sampling is only enabled when
  temperature > 0 (`HFBackend.generate` switches `do_sample` accordingly).
- Server backends are reached over `http://127.0.0.1:<port>/v1`; only the cloudflared tunnel exposes
  them outside Colab. `OLLAMA_HOST=0.0.0.0` / `OLLAMA_ORIGINS=*` are set so the tunnel can reach Ollama.
