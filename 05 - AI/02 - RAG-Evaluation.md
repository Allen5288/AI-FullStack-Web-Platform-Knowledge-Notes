# RAG Evaluation — How to Know If Retrieval Actually Works

> Daily note, started 2026-11-20. This file will be extended over the
> next few days — one topic, one file, dated sections. Next: a runnable
> evaluation script.

## 2026-11-20 — Part 1: Evaluate retrieval before you tune generation

A RAG system can look good in a demo and fail in production for one
reason: nobody measured retrieval. The LLM is usually not the weakest
link — the chunks it never sees are.

### The two halves to measure separately

1. **Retrieval** — did we fetch the right chunks?
2. **Generation** — given the right chunks, did the model answer
   faithfully, without inventing anything?

If you only score the final answer, you cannot tell which half broke.
Measure them separately, then fix the right one.

### Retrieval metrics that are actually useful

| Metric | What it tells you | When to use it |
|---|---|---|
| Recall@k | Of the chunks a human judged relevant, how many were in the top k? | The main health metric for a knowledge base |
| Precision@k | Of the top k retrieved, how many were relevant? | When irrelevant context makes the model ramble or hallucinate |
| MRR (mean reciprocal rank) | How high up is the first relevant chunk? | When one good chunk is usually enough |
| nDCG@k | Like recall, but a relevant chunk at rank 1 counts more than at rank 5 | When ranking order matters, e.g. long answers |

Rule of thumb for a first system: start with Recall@5 and
Precision@5 on 20–50 hand-written questions. That is enough to see
whether chunking or the embedding model is the problem.

### Generation metrics

- **Faithfulness** — every factual claim in the answer must be
  supported by a retrieved chunk. One unsupported claim = fail.
- **Answer relevance** — does the answer actually answer the question
  asked, not a nearby question?
- **Citation accuracy** — if you cite a chunk, is that chunk really
  the source of the claim?

Human review of 20 answers beats an automated score on 200 answers
when you are starting out. Automate only after you trust the rubric.

### Chunking trade-offs, in practice

- **Too small (100–200 tokens):** high precision, low recall — the
  answer is split across chunks and the model never sees the whole
  picture.
- **Too large (1,000+ tokens):** high recall, low precision — the
  model gets noise, costs more, and drifts.
- **A good starting point:** 400–600 tokens, with 10–20% overlap,
  split on semantic boundaries (headings, paragraphs) rather than
  fixed character counts.
- **Metadata filters first:** filter by `tenant_id`, `user_id`,
  document type or date *before* vector search. It is cheaper and
  safer than relying on the embedding to do access control —
  see `01 - RAG.md` §3 on retrieval security.

### A minimal golden test set

For each question, record:

```text
question:   What are the symptoms of diabetes?
relevant:   [doc-12 chunk 3, doc-12 chunk 4]
answer:     <the answer a domain expert would accept>
must_not:   <claims that would be wrong / unsafe to say>
```

Keep it in the repo, version it, and re-run it after every change
to chunking, embeddings, or the prompt. If the score drops, the
change does not ship — even if the demo looked better.

## 2026-11-20 — Browser test

Browser session test: this section was added via the GitHub web UI, not via the API, to check whether the signed-in session persists without a new two-factor prompt. Content to follow in the next daily update.

## 2026-11-21 — Part 2: the golden test set (20 questions) and scoring Recall@5 by hand

Yesterday's metrics are only useful once there are questions to run
them on. A golden test set is a small, hand-built list of questions
with the answers a human expert would accept — the ground truth every
later change is judged against.

### What goes into the set

- **20 questions to start.** Fewer than 10 and one lucky hit moves
  the score; more than 50 and nobody maintains it. Twenty is the size
  one person can write in an afternoon and keep current.
- **Cover the real use, not the easy cases.** Mix the question types
  users actually ask: factual lookups ("What is the maximum daily
  dose?"), comparisons ("How does X differ from Y?"), questions whose
  answer spans two documents, and questions with no answer in the
  corpus — the system must say "I don't know" instead of inventing
  one.
- **One row per question.** Keep it in a file the repo versions,
  e.g. `eval/golden.jsonl`, so a change to chunking or embeddings can
  be re-scored against the exact same questions.

```json
{"question": "What are the symptoms of diabetes?",
 "relevant": ["doc-12 chunk 3", "doc-12 chunk 4"],
 "answer": "Increased thirst, frequent urination, fatigue, blurred vision.",
 "must_not": ["diabetes is caused by eating too much sugar"]}
```

- `relevant` is the list of chunks a human judged necessary — this is
  what Recall@k is scored against.
- `answer` is the acceptable answer, written by a person who knows
  the documents.
- `must_not` lists claims that would be wrong or unsafe to say; if
  any appears in the output, the answer fails even if the rest is right.

### Scoring Recall@5 by hand in a spreadsheet

For each question, run retrieval, look at the top 5 chunks, and count
how many of the `relevant` chunks appear:

| question | relevant chunks | found in top 5 | Recall@5 |
|---|---|---|---|
| What are the symptoms of diabetes? | 2 | 2 | 1.00 |
| What is the maximum daily dose? | 3 | 2 | 0.67 |

Recall@5 for the set is the average of the per-question scores. A
first system should aim for 0.8 or above; below that, fix retrieval
before touching the prompt or the model — a better prompt cannot
rescue chunks the model never sees.

### Reading the result

- **Low recall, high precision** — the right chunks exist but are
  ranked below position 5: try a larger k, a better embedding model,
  or hybrid search (keyword + vector).
- **Low recall, low precision** — the chunks are not being found at
  all: the problem is usually chunking — re-check chunk size,
  overlap, and whether the answer is split across a chunk boundary.
- **High recall, low precision** — retrieval works but drags in
  noise: tighten metadata filters or lower k, and check whether the
  extra context is making the model ramble.

## 2026-11-22 — Part 3: checking faithfulness with a script, before any LLM judge

Retrieval metrics (Part 2) say whether the right chunks were fetched.
They say nothing about whether the answer stayed true to them. A model
can retrieve perfectly and still invent a dose, a date, or a
contraindication. Faithfulness is the second half of the score, and in
a medical assistant it is a safety rule, not a nice-to-have: one
unsupported factual claim fails the answer, even if the rest is right.

### The check, without an LLM

Do not start with an LLM judging another LLM — that hides the rubric
inside a prompt you cannot inspect. Start with checks a human can
audit in a minute:

1. **Split the answer into claims.** One sentence = one claim, for a
   first version. A claim is a single checkable statement ("Metformin
   is taken twice daily"), not a paragraph.
2. **Keyword overlap against the retrieved chunks.** For each claim,
   take its content words (drop stop words) and check how many appear
   in the retrieved chunks. A claim with no overlap is flagged
   *unsupported* — a human then decides whether it is truly invented
   or just paraphrased.
3. **Scan the `must_not` list.** If any forbidden claim appears
   (substring match, case-insensitive), the answer fails outright.
4. **Human verdict per claim.** The script flags; a person judges.
   The script's job is triage, not truth.

Overlap is a blunt instrument — paraphrase scores low, and a copied
sentence scores high even when the surrounding context changes its
meaning. That is acceptable for a first version: it catches the worst
failure (claims with no grounding at all) and the human rubric catches
the rest. Automate the rubric only after it is stable.

### The script — save as `eval/check_faithfulness.py`

```python
"""Faithfulness triage for RAG answers — stdlib only, no LLM judge.

Reads a JSONL file of answers (one object per line):
  {"question": ..., "answer": ..., "retrieved": ["chunk text", ...],
   "must_not": ["claim that must never appear"]}

For each answer it splits the answer into sentence-claims, checks each
claim's content words against the retrieved chunks, and scans must_not.
Verdicts are printed for a human to confirm — the script flags, it does
not decide.

Usage: python eval/check_faithfulness.py eval/answers-2026-11-22.jsonl
"""

import json
import re
import sys

STOP_WORDS = set(
    "a an the is are was were be been of to in on for and or with by as at "
    "it its this that these those from".split()
)


def content_words(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", text.lower())
    return {w for w in words if w not in STOP_WORDS and len(w) > 2}


def split_claims(answer: str) -> list[str]:
    return [c.strip() for c in re.split(r"(?<=[.!?])\s+", answer.strip()) if c.strip()]


def check_answer(row: dict) -> dict:
    chunks = " ".join(row.get("retrieved", []))
    chunk_words = content_words(chunks)
    verdicts = []
    for claim in split_claims(row["answer"]):
        words = content_words(claim)
        if not words:
            continue
        overlap = len(words & chunk_words) / len(words)
        verdicts.append((claim, "supported" if overlap >= 0.5 else "unsupported", round(overlap, 2)))
    failed = [m for m in row.get("must_not", []) if m.lower() in row["answer"].lower()]
    return {"question": row["question"], "claims": verdicts, "must_not_hits": failed}


def main(path: str) -> None:
    rows = [json.loads(line) for line in open(path) if line.strip()]
    failed_answers = 0
    for row in rows:
        result = check_answer(row)
        unsupported = [c for c, v, _ in result["claims"] if v == "unsupported"]
        bad = bool(unsupported or result["must_not_hits"])
        failed_answers += bad
        print(f"\n{'FAIL' if bad else 'PASS'}  {row['question']}")
        for claim, verdict, overlap in result["claims"]:
            print(f"  [{verdict} {overlap:.2f}] {claim}")
        for hit in result["must_not_hits"]:
            print(f"  [must_not] {hit}")
    print(f"\n{len(rows) - failed_answers}/{len(rows)} answers passed faithfulness triage")


if __name__ == "__main__":
    main(sys.argv[1])
```

### The human rubric, per claim

| Verdict | Meaning | What to do |
|---|---|---|
| supported | The retrieved chunks say this, in these words or close | Pass |
| paraphrased | Same meaning, different words — overlap check alone cannot confirm it | Human reads the chunk, then passes or fails it |
| unsupported | No chunk backs it | Answer fails |
| contradicted | A chunk says the opposite — the worst failure | Answer fails, and review the retrieval set: the model may have read the wrong chunk |

Rules: one `unsupported` factual claim = the answer fails; one
`contradicted` claim = the answer fails and the retrieval set is
reviewed; any `must_not` hit = automatic fail, no matter how good the
rest of the answer is.

### What this sets up

Run this script on the same 20 golden questions after every change to
the prompt or the model. Recall@5 (Part 2) guards retrieval;
faithfulness guards generation. A change must keep both scores, or it
does not ship.

### What I will add next in this file

- 2026-11-24: a combined evaluation report — one command, both scores
  (Recall@5 + faithfulness), with the judge's verdicts alongside the
    human rubric.
  - Later: tracking scores over time — when a swap improves Recall@5
    but costs faithfulness.

## 2026-11-23 — Part 4: LLM-as-judge — when it helps, when it lies, and how to calibrate it

Parts 2 and 3 gave us two scores a human can compute: Recall@5 for
retrieval, and a keyword-overlap triage plus a human rubric for
faithfulness. Both need a person in the loop for every answer. That
does not scale to hundreds of questions — which is where an
LLM-as-judge comes in: a second model grades the answers against the
same rubric. It is useful, but only if you know where it lies.

### What the judge is for

- **Regression checks at scale.** Re-run the golden set after a
  prompt or model change and let the judge flag the answers that
  changed verdict. A human then reads only the flagged ones.
- **Ranking, not truth.** The judge is good at "answer A is more
  faithful than answer B". It is bad at "this answer is correct".
- **It never replaces the human rubric for safety.** In medical
  answers, a `must_not` hit or a contradicted claim is a fail no
  matter what the judge says — those are checked by the deterministic
  rules in Part 3, not by a model.

### The four ways a judge lies

1. **Verbosity bias.** Longer answers score higher, even when the
   extra sentences add nothing. Mitigate: ask the judge to grade
   each claim separately, not the answer as a whole.
2. **Self-preference.** A model rates its own family's output
   higher. Mitigate: judge with a different model family than the
   one that generated the answer — if LLaMA 3 generated it, do not
   let LLaMA 3 judge it.
3. **Position bias.** Given two answers to compare, the judge
   prefers whichever is shown first. Mitigate: run the comparison
   twice, swapping the order, and only trust a verdict that agrees
   both ways.
4. **Grading without evidence.** A judge will happily say
   "supported" without ever pointing at the chunk. Mitigate: force
   the judge to quote the supporting chunk text. No quote, no pass.

### The judge prompt — rubric in the prompt, quote required

Put the rubric from Part 3 in the prompt, one claim at a time, and
require a quote for every "supported" verdict:

```text
You are grading one factual claim from a RAG answer against the
retrieved chunks. Reply with exactly one verdict and the evidence.

Claim: <one sentence from the answer>
Retrieved chunks:
<chunk 1 text>
<chunk 2 text>

Verdict: supported | paraphrased | unsupported | contradicted
Quote: <the exact chunk sentence that supports or contradicts the
claim, or "none">
Reason: <one sentence>

Rules:
- "supported" needs a quote that says the same thing.
- "paraphrased" means the same meaning in different words — quote
  the chunk and let a human confirm it.
- If no chunk backs the claim, say "unsupported", even if the claim
  sounds true. General knowledge does not count.
- Never use knowledge outside the chunks.
```

One claim per judge call keeps the verdicts honest: a whole-answer
grade hides the one bad sentence. It costs more calls, but the
golden set is only 20 questions — that is the right trade.

### Calibrating the judge against the human rubric

A judge you have never measured is a guess. Calibrate it on the
same 20 golden answers a human already graded in Part 3:

1. Run the judge over every claim in the 20 answers.
2. **Agreement rate** = claims where judge and human agree, divided
   by all claims. Aim for 0.85 or above before trusting the judge
   on new questions.
3. Look at the disagreements, not just the rate. If the judge calls
   "supported" what the human calls "unsupported", the prompt is too
   lenient — add a worked example of a failing claim. If it is too
   strict, it is usually punishing paraphrase; add an example of a
   legitimate paraphrase.
4. Re-calibrate whenever the judge model or the rubric changes.
   A new model is a new judge — its old calibration does not carry
   over.

```python
def agreement_rate(rows: list[dict]) -> float:
    # rows: {"claim": ..., "human": "supported", "judge": "supported"}
    agreed = sum(1 for r in rows if r["human"] == r["judge"])
    return agreed / len(rows) if rows else 0.0
```

### Rules for using a judge in this repo

- The judge grades; the deterministic checks in Part 3 decide
  safety. A `must_not` hit fails the answer whatever the judge says.
- One judge, one model, one rubric version per run — record all
  three with the score, or the number is meaningless next month.
- Spot-check 20% of judged answers by hand every run, including
  some the judge passed. A judge that is never checked drifts.
- If the judge and the human disagree on a claim, the human wins,
  and the disagreement goes into the calibration set.

### What this sets up

With Recall@5 (Part 2), faithfulness triage (Part 3) and a calibrated
judge (this part), the evaluation loop is complete: retrieval is
scored by a number, generation is scored by a rubric, and the judge
lets the same checks run at a scale a human cannot. The next step is
to run all of it with one command and keep the scores over time.

## 2026-11-24 — Part 5: one command, kept over time — the combined evaluation run

Parts 2–4 built the pieces: Recall@5 on the golden set, a faithfulness triage script, and a calibrated LLM-as-judge. A set of scripts nobody runs is not an evaluation loop — it is a folder. This part wires the three checks into one command and keeps the scores over time, so a regression is a number you can point at, not a feeling.

### The runner — save as `eval/run_eval.py`

One command runs all three checks in order and writes one JSON result file. Retrieval first — it is cheapest and fails fastest — then faithfulness, then the judge only if the first two pass. There is no point paying a judge to grade answers built on bad retrieval.

```python
# eval/run_eval.py — run from the repo root:
#   python eval/run_eval.py --golden eval/golden.jsonl --out eval/runs/2026-11-24.json
# Exit code 0 = all gates passed; 1 = a gate failed.
import argparse
import json
import subprocess
import sys
from pathlib import Path

GATES = {"recall_at_5": 0.80, "faithfulness_failures": 0, "judge_agreement": 0.85}

def run(cmd: list[str]) -> dict:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr, file=sys.stderr)
        sys.exit(1)
    return json.loads(result.stdout)

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--golden", default="eval/golden.jsonl")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    recall = run(["python", "eval/score_recall.py", "--golden", args.golden])
    faith = run(["python", "eval/check_faithfulness.py", "--golden", args.golden])
    judge = run(["python", "eval/judge.py", "--golden", args.golden])

    result = {
        "date": Path(args.out).stem,
        "recall_at_5": recall["recall_at_5"],
        "faithfulness_failures": faith["failures"],
        "judge_agreement": judge["agreement_rate"],
        "model": judge["model"],
        "rubric_version": "v1",
    }
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(result, indent=2))
    failed = (
        result["recall_at_5"] < GATES["recall_at_5"]
        or result["faithfulness_failures"] > GATES["faithfulness_failures"]
        or result["judge_agreement"] < GATES["judge_agreement"]
    )
    print(json.dumps(result, indent=2))
    print("GATES FAILED" if failed else "ALL GATES PASSED")
    sys.exit(1 if failed else 0)

if __name__ == "__main__":
    main()
```

Two rules for the sub-scripts: each one prints exactly one JSON object to stdout (logs go to stderr), and the gate values live in one place (`GATES`), so a threshold change is a one-line diff with the reason in the commit message.

### The score history — keep it in the repo

A single run's numbers are trivia; the trend is the signal. Keep the JSON result files (`eval/runs/YYYY-MM-DD.json`) and one table in this file, one row per run:

| Date | Recall@5 | Faithfulness failures | Judge agreement | Model | Note |
|---|---|---|---|---|---|
| 2026-11-24 | _fill in from the first run_ | | | | Baseline — first combined run |

- Never edit an old row. If a run was bad, the row stays bad and the fix gets a new row — rewriting history hides regressions.
- A run is only comparable to another run on the same golden set, same rubric version, same judge model. If any of those change, note it in the "Note" column and treat the trend as restarted.
- Keep the JSON files too, so anyone can re-check a row without re-running the model.

### Reading a regression — which half broke?

| Symptom | Likely cause | Fix in |
|---|---|---|
| Recall@5 drops, faithfulness holds | Chunking or embedding changed; a relevant chunk fell out of the top 5 | Part 2 — re-check chunk size, re-run the golden set per question |
| Recall@5 holds, faithfulness failures rise | Generation changed (new model, new prompt) — the model is adding claims | Parts 3–4 — tighten the prompt, re-calibrate the judge |
| Judge agreement drops below 0.85 | Judge model or rubric changed, or the judge is grading a new answer style | Part 4 — re-calibrate on the human-graded set before trusting it |
| Everything drops at once | The golden set or the documents changed — check what was ingested first | Part 1 — the data, not the model |

### When to run it

- After any change to chunking, embeddings, the prompt, or the model — before merging.
- Weekly on the unchanged system, to catch silent drift (a provider changing a model behind the same name is the classic one).
- Before any provider swap decision — the swap ships only if the new stack's row is no worse than the old stack's row on the same golden set.

### What this finishes

The RAG evaluation topic is now complete in this file: Part 1 (what to measure), Part 2 (retrieval scoring), Part 3 (faithfulness), Part 4 (LLM-as-judge), Part 5 (one command, kept over time). The next knowledge topic starts a new file.
