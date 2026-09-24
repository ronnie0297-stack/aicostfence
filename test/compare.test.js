import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { compareDirectories } from "../src/compare.js";
import { markdownReport } from "../src/report.js";

const catalog = { "openai/demo": { input: 0.000001, output: 0.000002 } };
const config = { monthlyCallsPerSite: 1000, assumedInputTokens: 1000, assumedOutputTokens: 1000, warnMonthlyCost: 50, failMonthlyCost: 250, failOnUnboundedTools: true };
const source = tokens => `generateText({model: 'openai/demo', maxOutputTokens: ${tokens}});`;
function fixture(t, before, after) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aicostfence-compare-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const [name, content] of [["before", before], ["after", after]]) {
    fs.mkdirSync(path.join(dir, name));
    fs.writeFileSync(path.join(dir, name, "app.ts"), content);
  }
  return { before: path.join(dir, "before"), after: path.join(dir, "after") };
}
test("cost increases, reductions, additions and removals use current minus baseline", t => {
  const f = fixture(t, source(1000), source(500));
  assert.equal(compareDirectories(f.after, f.before, catalog, config).comparison.monthlyDelta, -1);
  assert.equal(compareDirectories(f.before, f.after, catalog, config).comparison.monthlyDelta, 1);
  fs.writeFileSync(path.join(f.before, "app.ts"), "");
  assert.equal(compareDirectories(f.after, f.before, catalog, config).comparison.monthlyDelta, 2);
  assert.equal(compareDirectories(f.before, f.after, catalog, config).comparison.monthlyDelta, -2);
});
test("identical code uses one config even if baseline config differs", t => {
  const f = fixture(t, source(500), source(500));
  fs.writeFileSync(path.join(f.before, ".aicostfence.json"), '{"monthlyCallsPerSite":999999}');
  assert.equal(compareDirectories(f.after, f.before, catalog, config).comparison.monthlyDelta, 0);
});
test("unpriced calls on either side never look like savings", t => {
  const f = fixture(t, "generateText({model: selected, maxOutputTokens: 500});", source(500));
  for (const [current, baseline] of [[f.after, f.before], [f.before, f.after]]) {
    const result = compareDirectories(current, baseline, catalog, config);
    assert.equal(result.comparison.monthlyDelta, null);
    assert.equal(result.comparison.complete, false);
    assert.equal(result.status, "warn");
    assert.match(markdownReport(result), /\*\*unknown\*\*/);
  }
});
test("current guard failures survive comparison and overlapping or missing roots fail", t => {
  const f = fixture(t, source(1000), "streamText({model:'openai/demo',tools:{}});");
  assert.equal(compareDirectories(f.after, f.before, catalog, config).status, "fail");
  assert.throws(() => compareDirectories(f.after, f.after, catalog, config), /non-overlapping/);
  assert.throws(() => compareDirectories(path.dirname(f.after), f.before, catalog, config), /non-overlapping/);
  assert.throws(() => compareDirectories(f.after, path.join(f.before, "missing"), catalog, config));
});
test("CLI produces real JSON delta, preserves scan behavior and rejects incomplete options", t => {
  const f = fixture(t, source(1000).replace('openai/demo','openai/gpt-5.4-mini'), source(500).replace('openai/demo','openai/gpt-5.4-mini'));
  const cli = fileURLToPath(new URL('../src/index.js', import.meta.url));
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(GITHUB_|INPUT_)/.test(k)));
  env.AICOSTFENCE_OFFLINE = "1";
  const run = args => spawnSync(process.execPath, [cli, ...args], { env, encoding: "utf8" });
  const good = run(['scan', f.after, '--baseline', f.before, '--json']);
  assert.equal(good.status, 0, good.stderr);
  assert.ok(Math.abs(JSON.parse(good.stdout).comparison.monthlyDelta + 12) < 0.000001);
  assert.equal(JSON.parse(run(['scan', f.after, '--json']).stdout).comparison, undefined);
  assert.equal(run(['scan', f.after, '--baseline']).status, 2);
  const output = path.join(path.dirname(f.after), 'outputs.txt');
  const action = spawnSync(process.execPath, [cli], { env: { ...env, GITHUB_ACTIONS: 'true', INPUT_PATH: f.after, 'INPUT_BASELINE-PATH': f.before, INPUT_COMMENT: 'false', GITHUB_OUTPUT: output }, encoding: 'utf8' });
  assert.equal(action.status, 0, action.stderr);
  assert.match(fs.readFileSync(output, 'utf8'), /monthly-cost-delta=-12.00/);
  assert.match(action.stdout, /\*\*-\$12.00\*\*/);
});
