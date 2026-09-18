# AICostFence

AICostFence is a deterministic GitHub cost gate for applications built with the Vercel AI SDK. It finds supported AI call sites, resolves current token pricing, estimates spend from explicit traffic assumptions, and flags changes that can create runaway bills.

The MVP is deliberately narrow: TypeScript/JavaScript and `generateText`, `streamText`, `generateObject`, and `streamObject` calls. It never sends source code to a model.

## What it catches

- AI calls without an explicit output-token ceiling
- Tool-using calls without `stopWhen` or `maxSteps`
- Unknown or dynamic models that cannot be priced safely
- Projected monthly spend above repository warning or failure budgets

## Local usage

```bash
node src/index.js scan /path/to/project
node src/index.js scan /path/to/project --json
```

Copy `.aicostfence.example.json` to `.aicostfence.json`, then replace the traffic and budget assumptions with values that match the application.

## GitHub Action

```yaml
name: AI cost gate
on: pull_request

permissions:
  contents: read
  pull-requests: write

jobs:
  cost-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: YOUR_ORG/aicostfence@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The Action writes a job summary, updates one pull-request comment, and fails when a configured budget or agent-loop guard is violated.

## Estimation model

The calculation is intentionally legible:

```text
monthly cost = call sites × monthly calls per site ×
  ((assumed input tokens × input price) +
   (maximum output tokens × output price))
```

Prices are loaded from Vercel AI Gateway's public model catalog when available. A small dated fallback lets the scan degrade gracefully if the catalog is unavailable. Estimates are planning signals, not invoices.

## Roadmap

1. Git-diff cost deltas so pull requests show the incremental spend they introduce.
2. Native detection for OpenAI, Anthropic, and Google SDKs.
3. Autofix suggestions for token ceilings and AI SDK stop conditions.
4. Hosted history, shared policies, and budget alerts for private organizations.

## License

MIT
