# Sample AICostFence report

This is the pull-request feedback produced for [`examples/risky-agent.ts`](../examples/risky-agent.ts) with the example configuration.

## ❌ AICostFence: FAIL

Detected **1** AI call site. Projected monthly cost: **$30.00**.

| Location | Model | Per call | Monthly | Controls |
|---|---|---:|---:|---|
| `examples/risky-agent.ts:5` | `openai/gpt-5.4-mini` | $0.003000 | $30.00 | output unbounded, tool loop unbounded |

### Findings

- ⚠️ **unbounded-output**: Set `maxOutputTokens` so the worst-case request cost is explicit.
- ❌ **unbounded-tools**: Tool use has no `stopWhen` or `maxSteps` guard, so an agent loop can run away.

The [bounded version](../examples/bounded-agent.ts) adds both controls. Exact prices may change as the live catalog changes; the structure of the report stays the same.
