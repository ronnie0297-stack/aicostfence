#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { loadCatalog } from "./catalog.js";
import { markdownReport } from "./report.js";
import { scanDirectory } from "./scanner.js";

const DEFAULTS = {
  monthlyCallsPerSite: 10000,
  assumedInputTokens: 1000,
  assumedOutputTokens: 1000,
  warnMonthlyCost: 50,
  failMonthlyCost: 250,
  failOnUnboundedTools: true,
  catalogUrl: "https://ai-gateway.vercel.sh/v1/models"
};

function readConfig(configPath) {
  if (!fs.existsSync(configPath)) return { ...DEFAULTS };
  return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(configPath, "utf8")) };
}

function appendOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) fs.appendFileSync(outputFile, `${name}=${value}\n`);
}

async function postPullRequestComment(markdown) {
  if ((process.env.INPUT_COMMENT ?? "true") !== "true") return;
  const token = process.env.GITHUB_TOKEN;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !eventPath || !repository || !fs.existsSync(eventPath)) return;
  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  const issue = event.pull_request?.number;
  if (!issue) return;
  const [owner, repo] = repository.split("/");
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  const listUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issue}/comments?per_page=100`;
  const commentsResponse = await fetch(listUrl, { headers });
  if (!commentsResponse.ok) return;
  const comments = await commentsResponse.json();
  const existing = comments.find((comment) => comment.body?.includes("<!-- aicostfence-report -->"));
  const url = existing
    ? `https://api.github.com/repos/${owner}/${repo}/issues/comments/${existing.id}`
    : `https://api.github.com/repos/${owner}/${repo}/issues/${issue}/comments`;
  await fetch(url, { method: existing ? "PATCH" : "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ body: markdown }) });
}

async function main() {
  const isAction = Boolean(process.env.GITHUB_ACTIONS);
  const args = process.argv.slice(2);
  const root = isAction ? (process.env.INPUT_PATH ?? ".") : (args[0] === "scan" ? args[1] ?? "." : args[0] ?? ".");
  const configPath = isAction ? (process.env.INPUT_CONFIG ?? ".aicostfence.json") : path.join(root, ".aicostfence.json");
  const config = readConfig(configPath);
  const catalog = await loadCatalog(config);
  const result = scanDirectory(root, catalog, config);
  const markdown = markdownReport(result);

  if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else console.log(markdown);

  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  appendOutput("status", result.status);
  appendOutput("estimated-monthly-cost", result.estimatedMonthlyCost.toFixed(2));
  appendOutput("findings", result.findings.length);
  await postPullRequestComment(markdown);
  if (result.status === "fail") process.exitCode = 1;
}

main().catch((error) => {
  console.error(`AICostFence failed: ${error.message}`);
  process.exitCode = 2;
});
