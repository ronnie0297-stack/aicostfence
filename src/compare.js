import path from "node:path";
import { scanDirectory } from "./scanner.js";

export function compareDirectories(root, baseline, catalog, config) {
  const currentPath = path.resolve(root);
  const baselinePath = path.resolve(baseline);
  const overlaps = (a, b) => {
    const relative = path.relative(a, b);
    return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
  };
  if (overlaps(currentPath, baselinePath) || overlaps(baselinePath, currentPath)) {
    throw new Error("Current and baseline directories must be separate, non-overlapping directories.");
  }
  // One pricing snapshot and one configuration isolate code changes from price/config drift.
  const current = scanDirectory(root, catalog, config);
  const previous = scanDirectory(baseline, catalog, config);
  const unknown = result => result.callSites.filter(site => site.monthly === null || !Number.isFinite(site.monthly)).length;
  const baselineUnknown = unknown(previous);
  const currentUnknown = unknown(current);
  const complete = baselineUnknown === 0 && currentUnknown === 0;
  current.comparison = {
    complete,
    baselineMonthlyCost: complete ? previous.estimatedMonthlyCost : null,
    currentMonthlyCost: complete ? current.estimatedMonthlyCost : null,
    monthlyDelta: complete ? current.estimatedMonthlyCost - previous.estimatedMonthlyCost : null,
    baselineCallSites: previous.callSites.length,
    currentCallSites: current.callSites.length,
    baselineUnknownCallSites: baselineUnknown,
    currentUnknownCallSites: currentUnknown,
    baselineStatus: previous.status,
    assumptions: "Both scans use the current configuration and the same pricing snapshot."
  };
  if (!complete) {
    current.findings.push({ severity: "warning", code: "incomplete-comparison", file: ".aicostfence.json", line: 1,
      message: "At least one side contains unpriced calls; the total cost delta is unknown, not zero." });
    if (current.status === "pass") current.status = "warn";
  }
  return current;
}
