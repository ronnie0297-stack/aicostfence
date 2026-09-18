import test from "node:test";
import assert from "node:assert/strict";
import { scanSource } from "../src/scanner.js";

const catalog = {
  "openai/gpt-5.4-mini": { input: 0.6 / 1_000_000, output: 2.4 / 1_000_000 }
};

const config = {
  monthlyCallsPerSite: 10000,
  assumedInputTokens: 1000,
  assumedOutputTokens: 1000,
  failOnUnboundedTools: true
};

test("calculates a bounded AI SDK call", () => {
  const source = `
    const result = await generateText({
      model: openai('gpt-5.4-mini'),
      prompt: 'hello',
      maxOutputTokens: 500
    });
  `;
  const result = scanSource({ source, file: "app.ts", catalog, config });
  assert.equal(result.callSites.length, 1);
  assert.equal(result.callSites[0].model, "openai/gpt-5.4-mini");
  assert.equal(result.callSites[0].monthly, 18);
  assert.equal(result.findings.length, 0);
});

test("blocks an unbounded tool loop", () => {
  const source = `
    await streamText({
      model: 'openai/gpt-5.4-mini',
      tools: myTools
    });
  `;
  const result = scanSource({ source, file: "agent.ts", catalog, config });
  assert.deepEqual(result.findings.map((item) => item.code), ["unbounded-output", "unbounded-tools"]);
  assert.equal(result.findings[1].severity, "error");
});

test("reports dynamic model selection without inventing a cost", () => {
  const source = "await generateText({ model: selectedModel, prompt: 'hello', maxOutputTokens: 100 });";
  const result = scanSource({ source, file: "route.ts", catalog, config });
  assert.equal(result.callSites[0].monthly, null);
  assert.equal(result.findings[0].code, "dynamic-model");
});
