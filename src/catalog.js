const FALLBACK_MODELS = {
  "openai/gpt-5.4-mini": { input: 0.6 / 1_000_000, output: 2.4 / 1_000_000 },
  "google/gemini-3.8-flash": { input: 0.75 / 1_000_000, output: 3.75 / 1_000_000 }
};

export function normalizeModel(provider, model) {
  if (model.includes("/")) return model;
  const prefixes = {
    openai: "openai",
    anthropic: "anthropic",
    google: "google",
    googleai: "google",
    gemini: "google"
  };
  return provider && prefixes[provider.toLowerCase()]
    ? `${prefixes[provider.toLowerCase()]}/${model}`
    : model;
}

function parseCatalog(payload) {
  const models = {};
  for (const item of payload?.data ?? []) {
    if (item.type !== "language" || !item.pricing?.input || !item.pricing?.output) continue;
    const input = Number(item.pricing.input);
    const output = Number(item.pricing.output);
    if (Number.isFinite(input) && Number.isFinite(output)) {
      models[item.id] = { input, output, source: "live" };
    }
  }
  return models;
}

export async function loadCatalog(config = {}) {
  const fallback = Object.fromEntries(
    Object.entries(FALLBACK_MODELS).map(([id, price]) => [id, { ...price, source: "fallback" }])
  );
  if (process.env.AICOSTFENCE_OFFLINE === "1") return fallback;

  const url = config.catalogUrl ?? "https://ai-gateway.vercel.sh/v1/models";
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return fallback;
    return { ...fallback, ...parseCatalog(await response.json()) };
  } catch {
    return fallback;
  }
}
