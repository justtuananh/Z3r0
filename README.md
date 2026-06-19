# 🕳️ Z3r0 — Refusal-Direction & Safety-Mechanism Study

A study/research project to test how the **safety mechanism (refusal direction)** of open LLMs
behaves once it is removed via **abliteration / "obliteration"**. Everything runs in **Google
Colab** — there are no `.py` files to install; open the notebook and run it top-to-bottom.

➡️ **[`notebooks/Z3r0_colab.ipynb`](notebooks/Z3r0_colab.ipynb)** — the whole project (serving + benchmark + report).

## What it compares

Three models that share the **same base** (`DeepSeek-R1-Distill-Llama-8B`), so the only variable
is the safety tuning:

| Key | Role | Ollama tag |
|---|---|---|
| `control` | refusal intact (baseline) | `deepseek-r1:8b` |
| `huihui` | abliterated | `huihui_ai/deepseek-r1-abliterated:8b` |
| `obliteratus` | obliterated | `OBLITERATUS/DeepSeek-R1-Distill-Llama-8B-OBLITERATED` |

## How to use

1. Open the notebook in Colab and set **Runtime → Change runtime type → T4 GPU**.
2. In the **form cell** pick a **model** and a **deployment method** (`ollama` / `hf` / `vllm` / `sglang`).
3. Run the cells: it serves **one model at a time**, gives you a **public cloudflared URL** to test it,
   then benchmarks refusal vs over-refusal.

## What it measures

- **AdvBench** (harmful prompts) → *refusal rate* (higher = stronger safety; abliterated ≈ 0).
- **XSTest** (benign "borderline" prompts) → *over-refusal rate* (lower = answers off-topic questions).
- Scoring: substring refusal classifier on the answer after stripping the R1 `<think>` trace.

## ⚖️ Ethics

Harmful prompts are issued **only** to measure refusal behavior for safety research. Model outputs
stay in the Colab session for analysis and are not redistributed.
