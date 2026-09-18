# Contributing

Thank you for helping make AI cost checks more useful and more accurate.

## Development

Requirements: Node.js 20 or newer. AICostFence has no runtime dependencies.

```bash
npm test
AICOSTFENCE_OFFLINE=1 node src/index.js scan examples
```

Add a focused test for every new rule. Findings should be deterministic, explain the risk in plain language, and avoid claiming that an estimate is an invoice.

## Pull requests

- Keep changes narrowly scoped.
- Do not add telemetry or source-code uploads.
- Cite a primary provider source when changing fallback model prices.
- Describe false-positive risks for new detection rules.

Use GitHub issues for feature requests and ordinary bugs. Follow `SECURITY.md` for vulnerabilities.
