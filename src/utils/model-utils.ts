import { AppConfig } from "./config";
import { getProvider } from "./providers";

const MODEL_LIST_TIMEOUT_MS = 2_000; // 2 seconds
export const RECOMMENDED_MODELS: Array<string> = [
  "o4-mini",
  "o3",
  // OpenAI
  "gpt-4",
  "gpt-4-32k",
  "gpt-4-turbo-preview",
  "gpt-4-vision-preview",
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k",
  // Anthropic
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
  "claude-2.1",
  "claude-2.0",
  "claude-instant-1.2",
  // Google
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash-latest",
  "gemini-1.0-pro",
  "gemini-pro-vision",
];

let modelsPromise: Promise<Array<string>> | null = null;

async function fetchModels(providerName: AppConfig["provider"]): Promise<Array<string>> {
  try {
    const provider = getProvider(providerName);
    const models = await provider.listModels();
    return models.sort();
  } catch {
    return [];
  }
}

export function preloadModels(providerName: AppConfig["provider"]): void {
  if (!modelsPromise) {
    // Fire‑and‑forget – callers that truly need the list should `await`
    // `getAvailableModels()` instead.
    void getAvailableModels(providerName);
  }
}

export async function getAvailableModels(
  providerName: AppConfig["provider"]
): Promise<Array<string>> {
  if (!modelsPromise) {
    modelsPromise = fetchModels(providerName);
  }
  return modelsPromise;
}

/**
 * Verify that the provided model identifier is present in the set returned by
 * {@link getAvailableModels}. The list of models is fetched from the provider's
 * API the first time it is required and then cached in‑process.
 */
export async function isModelSupportedForResponses(
  config: AppConfig
): Promise<boolean> {
  if (
    typeof config.model !== "string" ||
    config.model.trim() === "" ||
    RECOMMENDED_MODELS.includes(config.model)
  ) {
    return true;
  }

  try {
    const models = await Promise.race<Array<string>>([
      getAvailableModels(config.provider),
      new Promise<Array<string>>((resolve) =>
        setTimeout(() => resolve([]), MODEL_LIST_TIMEOUT_MS)
      ),
    ]);

    // If the timeout fired we get an empty list → treat as supported to avoid
    // false negatives.
    if (models.length === 0) {
      return true;
    }

    return models.includes(config.model.trim());
  } catch {
    // Network or library failure → don't block start‑up.
    return true;
  }
}
