function money(value) {
  return value === null ? "unknown" : `$${value.toFixed(value < 0.01 ? 6 : 2)}`;
}

export function markdownReport(result) {
  const icon = result.status === "pass" ? "✅" : result.status === "warn" ? "⚠️" : "❌";
  const lines = [
    `## ${icon} AICostFence: ${result.status.toUpperCase()}`,
    "",
    `Detected **${result.callSites.length}** AI call site(s). Projected monthly cost: **${money(result.estimatedMonthlyCost)}**.`,
    "",
    "| Location | Model | Per call | Monthly | Controls |",
    "|---|---|---:|---:|---|"
  ];

  if (result.comparison) {
    const c = result.comparison;
    const delta = c.monthlyDelta === null ? "unknown" : `${c.monthlyDelta < 0 ? "-" : c.monthlyDelta > 0 ? "+" : ""}$${Math.abs(c.monthlyDelta).toFixed(2)}`;
    lines.splice(4, 0, "### Cost change", "",
      "| Baseline / month | Current / month | Change / month |",
      "|---:|---:|---:|",
      `| ${money(c.baselineMonthlyCost)} | ${money(c.currentMonthlyCost)} | **${delta}** |`, "",
      `Detected calls: ${c.baselineCallSites} before → ${c.currentCallSites} after. Baseline guard status: ${c.baselineStatus}.`, "",
      c.assumptions,
      "Unrecognized calls are outside coverage. Estimates exclude step multiplication, retries, and paid tools; reductions are not measured savings.", "");
  }

  for (const site of result.callSites) {
    const controls = [site.maxOutputTokens ? `output ≤ ${site.maxOutputTokens}` : "output unbounded"];
    if (site.hasTools) controls.push(site.hasStop ? "tool loop bounded" : "tool loop unbounded");
    lines.push(`| \`${site.file}:${site.line}\` | ${site.model ? `\`${site.model}\`` : "dynamic"} | ${money(site.perCall)} | ${money(site.monthly)} | ${controls.join(", ")} |`);
  }

  if (result.callSites.length === 0) lines.push("| — | — | — | — | No supported AI SDK calls detected | ");
  if (result.findings.length) {
    lines.push("", "### Findings", "");
    for (const item of result.findings) {
      const marker = item.severity === "error" ? "❌" : "⚠️";
      lines.push(`- ${marker} **${item.code}** at \`${item.file}:${item.line}\`: ${item.message}`);
    }
  }
  lines.push("", "_Estimates use configured traffic assumptions and current catalog prices; actual invoices can differ._", "<!-- aicostfence-report -->");
  return `${lines.join("\n")}\n`;
}
