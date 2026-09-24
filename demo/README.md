# See AICostFence fail, then pass

Run the published AICostFence 0.1.0 scanner against two versions of the same AI call. The first has no explicit limits; the second adds an output-token ceiling and a step limit.

## Try it

Requires Git, Node.js 20 or newer and npm. In a terminal:

```sh
git clone https://github.com/ronnie0297-stack/aicostfence.git
cd aicostfence/demo
npm ci --ignore-scripts
npm run demo
```

Installation downloads the scanner from npm. After installation the demo runs offline, without an API key or model charges. The TypeScript files are scan-only fixtures; the demo never executes them or imports their SDK dependencies.

Expected terminal output:

```text
BEFORE: FAIL | exit 1 | estimate $30.00 | 2 findings
AFTER: PASS | exit 0 | estimate $25.20 | 0 findings

Verified: risky code fails; corrected code passes. Reports saved in reports/.
```

Open `reports/demo.md` for the actual scanner reports. Individual JSON and Markdown results are saved alongside it. The demo checks the real CLI exit codes and findings; an empty scan or unexpected result fails verification.

## What changes?

### New: compare the two estimates

From `aicostfence/demo`, run `node scripts/compare.mjs` to exercise the repository's v0.2.0 comparison implementation. It verifies **$30.00 before → $25.20 after → -$4.80/month** using the same fallback prices and current configuration. This is an estimate change, not measured savings. The original `npm run demo` remains pinned to published v0.1.0 for its fail/pass example.

Compare `before/agent.ts` with `after/agent.ts`. The corrected example adds:

```ts
maxOutputTokens: 800,
stopWhen: stepCountIs(5),
```

The first scan fails because the configured rule rejects tool calls without an explicit stopping control. The second passes the scanner's current checks. Passing is not a guarantee of a safe bill or correct runtime behavior.

Both examples use identical traffic assumptions: 10,000 calls/month, 1,000 assumed input tokens, a $50 warning threshold and a $250 failure threshold. Missing output limits use an assumed 1,000 output tokens for estimation; the corrected example uses 800.

## Understand the numbers

This reproducible demo deliberately uses the release's bundled fallback prices: $0.60 per million input tokens and $2.40 per million output tokens for its example model. These are fixture values, not a statement of current provider prices.

The scanner estimates $30.00 before and $25.20 after. It does not multiply by agent steps or include retries, paid tools, or growing conversation context. The $30 estimate is not a maximum for the risky example, and the difference is not measured savings.

Version 0.1.0 detects inline configuration with text matching; it does not resolve wrappers or imported defaults or validate the stopping expression's behavior. The demo proves the released scanner's fail/pass behavior, not a full application integration.

## Run on GitHub

The [demo workflow](https://github.com/ronnie0297-stack/aicostfence/actions/workflows/demo.yml) runs both scans and verifies that the first fails and the second passes. The overall workflow is green when both expected outcomes are correct. Actual reports appear in the workflow job summary. It does not post comments or require write access.

[Get AICostFence](https://github.com/ronnie0297-stack/aicostfence) · [npm package](https://www.npmjs.com/package/aicostfence) · [Marketplace](https://github.com/marketplace/actions/aicostfence)
