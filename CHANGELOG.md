# Changelog

## 0.2.0 - 2026-09-24

- Compare separate baseline and current source directories via `--baseline` or the Action's `baseline-path` input.
- Show baseline/current monthly totals and their signed change using one configuration and pricing snapshot.
- Return unknown deltas for unpriced calls rather than inventing savings.
- Preserve current guard failures; expose comparison completeness and delta as Action outputs.
- Add CLI/Action comparison tests and a verified before-and-after comparison demo.
- Limitations: inline detected calls only; no retry, agent-step, or paid-tool cost accounting.

## 0.1.0 - Unreleased

- Detect supported Vercel AI SDK call sites in JavaScript and TypeScript.
- Resolve current token pricing from the public Vercel AI Gateway catalog.
- Estimate per-call and monthly cost from repository-owned assumptions.
- Flag unbounded output, unbounded tool loops, dynamic models, and unknown prices.
- Write GitHub job summaries and update pull-request comments.
- Enforce repository warning and failure budgets.
