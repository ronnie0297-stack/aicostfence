import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(root, 'node_modules/aicostfence/src/index.js');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/aicostfence/package.json')));
assert.equal(pkg.version, '0.1.0', 'Demo must run the pinned release');
// Keep CI variables from changing the CLI path, writing comments or overwriting summaries.
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(GITHUB_|INPUT_)/i.test(key)));
env.AICOSTFENCE_OFFLINE = '1';
const reports = path.join(root, 'reports');
fs.mkdirSync(reports, { recursive: true });
let summary = '# AICostFence: before and after\n\nActual output from the published npm package, version 0.1.0.\n\nOffline demo uses bundled fallback prices, not current provider pricing. These are single-call planning estimates, not full agent-run budgets.\n\n';

for (const [scenario, expectedExit, expectedStatus, expectedCost, expectedCodes] of [
  ['before', 1, 'fail', 30, ['unbounded-output', 'unbounded-tools']],
  ['after', 0, 'pass', 25.2, []]
]) {
  const run = (json) => spawnSync(process.execPath, [cli, 'scan', scenario, ...(json ? ['--json'] : [])], { cwd: root, env, encoding: 'utf8', timeout: 15000 });
  const jsonRun = run(true);
  assert.ifError(jsonRun.error);
  assert.equal(jsonRun.status, expectedExit, `${scenario}: unexpected exit code: ${jsonRun.stderr}`);
  const result = JSON.parse(jsonRun.stdout);
  assert.equal(result.status, expectedStatus);
  assert.equal(result.callSites.length, 1, 'A scan with no detected calls is not a successful demo');
  assert.deepEqual(result.findings.map(f => f.code), expectedCodes);
  assert.ok(Math.abs(result.estimatedMonthlyCost - expectedCost) < 0.000001);
  const markdownRun = run(false);
  assert.ifError(markdownRun.error);
  assert.equal(markdownRun.status, expectedExit);
  fs.writeFileSync(path.join(reports, `${scenario}.json`), jsonRun.stdout);
  fs.writeFileSync(path.join(reports, `${scenario}.md`), markdownRun.stdout);
  summary += `## ${scenario === 'before' ? '1. Missing limits: expected failure' : '2. Explicit limits: passes'}\n\nCLI exit code: ${expectedExit}\n\n${markdownRun.stdout}\n`;
  console.log(`${scenario.toUpperCase()}: ${expectedStatus.toUpperCase()} | exit ${jsonRun.status} | estimate $${result.estimatedMonthlyCost.toFixed(2)} | ${result.findings.length} findings`);
}
fs.writeFileSync(path.join(reports, 'demo.md'), summary);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
console.log('\nVerified: risky code fails; corrected code passes. Reports saved in reports/.');
