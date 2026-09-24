# AICostFence

**Catch expensive AI code before it reaches production.**

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-AICostFence-2ea44f?logo=github)](https://github.com/marketplace/actions/aicostfence)
[![Test](https://github.com/ronnie0297-stack/aicostfence/actions/workflows/test.yml/badge.svg)](https://github.com/ronnie0297-stack/aicostfence/actions/workflows/test.yml)
[![Release](https://img.shields.io/github/v/release/ronnie0297-stack/aicostfence)](https://github.com/ronnie0297-stack/aicostfence/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AICostFence is a free GitHub Action that reviews Vercel AI SDK calls on every pull request. It estimates monthly model spend from your traffic assumptions and can block unbounded agents or changes above your budget.

**No account. No API key. No source code sent to a model.**

**Try the [working before-and-after demo](demo/README.md):** run the published scanner on risky code, then its corrected version. [View the verified demo runs](https://github.com/ronnie0297-stack/aicostfence/actions/workflows/demo.yml).

## Install in 60 seconds

Create `.github/workflows/ai-cost.yml`:

```yaml
name: AI cost check
on: pull_request

permissions:
  contents: read
  pull-requests: write

jobs:
  cost-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ronnie0297-stack/aicostfence@v0.1.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Copy [`.aicostfence.example.json`](.aicostfence.example.json) to `.aicostfence.json`, set your expected traffic and monthly budget, then open a pull request.

## What appears in your pull request

```text
❌ AICostFence: FAIL

Detected 1 AI call site. Projected monthly cost: $30.00.

agent.ts:8  openai/gpt-5.4-mini  output unbounded, tool loop unbounded

• Set maxOutputTokens so the worst-case request cost is explicit.
• Tool use has no stopWhen or maxSteps guard, so an agent loop can run away.
```

See the [risky example](examples/risky-agent.ts), its [bounded replacement](examples/bounded-agent.ts), and a [complete sample report](docs/sample-report.md).

## What it catches

- AI calls without an explicit output-token ceiling
- Tool-using calls without `stopWhen` or `maxSteps`
- Unknown or dynamic models that cannot be priced safely
- Projected monthly spend above repository warning or failure budgets

## Why use a pull-request cost gate?

Provider dashboards show spend after calls happen. AICostFence checks the code before merge, when a model change, missing token ceiling, or unbounded tool loop is still cheap to fix. Its assumptions and calculations stay visible in the repository instead of hiding behind a proprietary score.

## Local usage

Requires Node.js 20 or newer. Run from your JavaScript/TypeScript project folder:

```bash
npx --yes aicostfence@0.1.0 scan .
npx --yes aicostfence@0.1.0 scan . --json
```

Or install a pinned development dependency:

```bash
npm install --save-dev aicostfence@0.1.0
npx aicostfence scan .
```

The report lists detected call sites, estimates, and findings. Exit code `0` means pass or warning, `1` means a failed guard, and `2` means an execution error. No detected calls does not establish that your application's AI usage is covered. Scans use public model pricing when available but do not invoke a model.

For contributors running from a source checkout:

```bash
node src/index.js scan /path/to/project
node src/index.js scan /path/to/project --json
```

Copy `.aicostfence.example.json` to `.aicostfence.json`, then replace the traffic and budget assumptions with values that match the application.

The Action writes a job summary, updates one pull-request comment, and fails when a configured budget or agent-loop guard is violated.

## Compare a proposed change (v0.2.0)

Use two separate source directories, one for the proposed code and one for its baseline:

The GitHub v0.2.0 release includes this feature. npm publication of v0.2.0 is pending; until it is published, use `node src/index.js scan ./current --baseline ./baseline` from a v0.2.0 source checkout. The following npm commands apply once that version is available:

```bash
npx --yes aicostfence@0.2.0 scan ./current --baseline ./baseline
npx --yes aicostfence@0.2.0 scan ./current --baseline ./baseline --json
```

The report shows baseline monthly cost, current monthly cost, and their signed difference. Both scans use **the current configuration and one shared pricing snapshot**. This isolates code changes; it does not compare historical traffic settings or historical prices. If either side contains an unpriced call, the total delta is `unknown`. The current code's existing budget and safety guards still determine pass/fail; baseline failures are informational.

For a pull request, explicitly check out its base and head into sibling directories:

```yaml
name: AI cost comparison
on: pull_request
permissions:
  contents: read
  pull-requests: write
jobs:
  compare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          path: current
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.base.sha }}
          path: baseline
      - uses: ronnie0297-stack/aicostfence@v0.2.0
        with:
          path: current
          config: current/.aicostfence.json
          baseline-path: baseline
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The action scans source files without executing application code. Fork PRs may have read-only tokens; the job summary remains available when comments cannot be written. Keep the source directories separate; overlapping directories are rejected. Estimates cover recognized inline calls only, not wrappers, retries, step multiplication, or paid tools. [Run the comparison demo](demo/README.md).

## Supported today

- JavaScript and TypeScript
- Vercel AI SDK `generateText`, `streamText`, `generateObject`, and `streamObject`
- Literal model identifiers and repository-owned traffic assumptions

AICostFence is an early release. Treat estimates as planning signals, not invoices. Open a [feature request](https://github.com/ronnie0297-stack/aicostfence/issues/new?template=feature.yml) if your provider or SDK is not covered yet.

## Estimation model

The calculation is intentionally legible:

```text
monthly cost = call sites × monthly calls per site ×
  ((assumed input tokens × input price) +
   (maximum output tokens × output price))
```

Prices are loaded from Vercel AI Gateway's public model catalog when available. A small dated fallback lets the scan degrade gracefully if the catalog is unavailable. Estimates are planning signals, not invoices.

## Roadmap

1. Finer-grained file and call-site cost deltas beyond the repository totals available in v0.2.0.
2. Native detection for OpenAI, Anthropic, and Google SDKs.
3. Autofix suggestions for token ceilings and AI SDK stop conditions.
4. Hosted history, shared policies, and budget alerts for private organizations.

## Help shape the product

Using AICostFence in a real repository? [Tell us what happened](https://github.com/ronnie0297-stack/aicostfence/issues/new?template=adoption.yml). That short, asynchronous feedback determines which SDK and paid team features are built next.

## License

MIT
