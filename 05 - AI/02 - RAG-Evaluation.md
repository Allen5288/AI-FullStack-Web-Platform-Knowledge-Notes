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

### What I will add next in this file

- 2026-11-22: a small Python evaluation script (no LLM judge yet —
  exact-match + human rubric first).
- Later: LLM-as-judge, and when it is (and is not) trustworthy.
