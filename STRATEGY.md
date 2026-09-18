# AICostFence launch strategy

## Decision

Build a free, deterministic GitHub Action for AI application cost review, then monetize organization-wide governance rather than charging for the basic scanner.

## Why this wedge

- AI projects and agent workflows are growing rapidly on GitHub.
- Model usage is becoming more consumption-based, making cost visible and painful.
- Current competitors are fragmented between prompt-file estimates, after-the-fact dashboards, and runtime proxy products.
- A pull-request gate is earlier in the lifecycle: it identifies a costly model swap, larger output ceiling, or unbounded agent loop before deployment.
- Static analysis and public price metadata keep operating cost near zero during validation.

## Initial customer

A solo developer or small team building a TypeScript AI product with the Vercel AI SDK and GitHub Actions. They want protection from surprise API bills but will not adopt enterprise FinOps infrastructure.

## Offer

- Free: public Action, current pricing, PR report, configurable budgets, local-only source scanning.
- Pro target: $12/month for private-repo history, budget alerts, and automatic fix pull requests.
- Team target: $29/month for shared policies, unlimited repositories, and organization reporting.

The paid plan should not be built until the free Action demonstrates repeat use. GitHub requires a paid Marketplace App to reach its installation and publisher-verification thresholds, so the early goal is adoption, not premature billing integration.

## Validation gates

1. Ten external repositories complete a scan.
2. At least three users keep the Action enabled for a second pull request.
3. At least two users request history, organization policy, or automated fixes.
4. Only then spend money on a domain, hosted dashboard, or paid infrastructure.

## Budget

- Current spend: $0.
- Validation ceiling: $20 for a domain only after name checks and a working public repository.
- Hosting: free tiers until a hosted paid feature has active demand.
- Remaining initial budget stays uncommitted.

## Distribution without meetings

- GitHub Actions Marketplace listing.
- Example pull requests that show real before/after cost findings.
- Search-focused documentation for AI SDK cost estimation and agent-loop budget protection.
- Useful, disclosed launch posts in relevant developer communities; no unsolicited direct messages.
- Issues and email for asynchronous support.

## Kill criteria

Pause or reposition if the Action cannot earn ten genuine installs after the initial documentation and launch cycle, or if users consistently report that provider dashboards already solve the problem.
