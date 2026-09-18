# Security policy

## Reporting a vulnerability

Please do not open a public issue for a vulnerability that could expose repository data, credentials, or GitHub tokens. Use GitHub's private vulnerability reporting feature when it is enabled for this repository.

Include the affected version, a minimal reproduction, impact, and any suggested mitigation. We will acknowledge a complete report asynchronously and publish a fix before detailed disclosure whenever practical.

## Data handling

AICostFence scans checked-out source files inside the GitHub Actions runner. Source code is not sent to an AI model. The scanner requests only public model-pricing metadata. Pull-request comments contain file paths, line numbers, model identifiers, estimates, and rule findings; they do not contain source snippets.

Use a read-only `contents` permission and `pull-requests: write` only when PR comments are enabled.
