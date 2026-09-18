import fs from "node:fs";
import path from "node:path";
import { normalizeModel } from "./catalog.js";

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "dist", "build", "coverage", ".next"]);
const CALL_PATTERN = /\b(generateText|streamText|generateObject|streamObject)\s*\(\s*\{/g;

function listFiles(root) {
  const results = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) results.push(...listFiles(full));
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) results.push(full);
  }
  return results;
}

function lineAt(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function balancedObject(source, openingBrace) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = openingBrace; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(openingBrace, i + 1);
    }
  }
  return source.slice(openingBrace);
}

function modelFromBlock(block) {
  const match = block.match(/\bmodel\s*:\s*(?:([A-Za-z_$][\w$]*)\s*\(\s*)?["']([^"']+)["']/);
  if (!match) return null;
  return normalizeModel(match[1], match[2]);
}

function numericProperty(block, names) {
  const pattern = new RegExp(`\\b(?:${names.join("|")})\\s*:\\s*(\\d+)`);
  const match = block.match(pattern);
  return match ? Number(match[1]) : null;
}

export function scanSource({ source, file, catalog, config }) {
  const callSites = [];
  const findings = [];
  let match;

  while ((match = CALL_PATTERN.exec(source)) !== null) {
    const brace = source.indexOf("{", match.index);
    const block = balancedObject(source, brace);
    const line = lineAt(source, match.index);
    const model = modelFromBlock(block);
    const maxOutputTokens = numericProperty(block, ["maxOutputTokens", "maxTokens"]);
    const hasTools = /\btools\s*:/.test(block);
    const hasStop = /\b(stopWhen|maxSteps)\s*:/.test(block);
    const assumedOutput = maxOutputTokens ?? config.assumedOutputTokens;
    const price = model ? catalog[model] : null;
    const perCall = price
      ? config.assumedInputTokens * price.input + assumedOutput * price.output
      : null;
    const monthly = perCall === null ? null : perCall * config.monthlyCallsPerSite;

    callSites.push({ file, line, function: match[1], model, maxOutputTokens, hasTools, hasStop, perCall, monthly });

    if (!model) {
      findings.push({ severity: "warning", code: "dynamic-model", file, line, message: "Model is dynamic; cost cannot be calculated deterministically." });
    } else if (!price) {
      findings.push({ severity: "warning", code: "unknown-model", file, line, message: `No current catalog price was found for ${model}.` });
    }

    if (maxOutputTokens === null) {
      findings.push({ severity: "warning", code: "unbounded-output", file, line, message: "Set maxOutputTokens so the worst-case request cost is explicit." });
    }

    if (hasTools && !hasStop) {
      findings.push({
        severity: config.failOnUnboundedTools ? "error" : "warning",
        code: "unbounded-tools",
        file,
        line,
        message: "Tool use has no stopWhen or maxSteps guard, so an agent loop can run away."
      });
    }
  }

  return { callSites, findings };
}

export function scanDirectory(root, catalog, config) {
  const absoluteRoot = path.resolve(root);
  const callSites = [];
  const findings = [];
  for (const file of listFiles(absoluteRoot)) {
    const source = fs.readFileSync(file, "utf8");
    const relative = path.relative(absoluteRoot, file).replaceAll("\\", "/");
    const result = scanSource({ source, file: relative, catalog, config });
    callSites.push(...result.callSites);
    findings.push(...result.findings);
  }

  const estimatedMonthlyCost = callSites.reduce((sum, site) => sum + (site.monthly ?? 0), 0);
  if (estimatedMonthlyCost >= config.failMonthlyCost) {
    findings.push({ severity: "error", code: "monthly-budget", file: ".aicostfence.json", line: 1, message: `Projected monthly cost $${estimatedMonthlyCost.toFixed(2)} exceeds the $${config.failMonthlyCost.toFixed(2)} limit.` });
  } else if (estimatedMonthlyCost >= config.warnMonthlyCost) {
    findings.push({ severity: "warning", code: "monthly-budget", file: ".aicostfence.json", line: 1, message: `Projected monthly cost $${estimatedMonthlyCost.toFixed(2)} exceeds the $${config.warnMonthlyCost.toFixed(2)} warning level.` });
  }

  const status = findings.some((item) => item.severity === "error")
    ? "fail"
    : findings.length > 0
      ? "warn"
      : "pass";
  return { status, estimatedMonthlyCost, callSites, findings };
}
