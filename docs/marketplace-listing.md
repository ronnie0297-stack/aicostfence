# GitHub Marketplace listing draft

## Name

AICostFence

## Short description

Block AI SDK changes that can create runaway model costs.

## Full description

AICostFence reviews JavaScript and TypeScript AI SDK call sites on every pull request. It resolves current model prices, calculates projected spend from repository-owned traffic assumptions, and reports risky changes directly in GitHub.

The Action catches missing output-token ceilings, tool loops without stop conditions, models that cannot be priced deterministically, and estimated monthly spend above configured limits. It runs without an AI model and does not transmit source code to a model provider.

## Primary category

Code quality

## Secondary category

Utilities

## Recommended topics

`ai`, `finops`, `github-actions`, `llm`, `cost-control`, `vercel-ai-sdk`

## Launch headline

Know what an AI code change can cost before you merge it.

## Launch copy

AI API bills usually arrive after the code has shipped. AICostFence moves the cost check into the pull request. It produces a legible estimate, highlights unbounded agent behavior, and can block changes that exceed the repository's budget policy.

Start free. No account, API key, or source upload is required.
