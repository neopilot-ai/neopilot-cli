import {
  ANTHROPIC_API_KEY,
  GOOGLE_API_KEY,
  OPENAI_API_KEY,
  AIProvider as AIProviderName,
} from "./config";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export interface AIProvider {
  listModels(): Promise<Array<string>>;
  createClient(): OpenAI | Anthropic | GoogleGenerativeAI;
}

class OpenAIProvider implements AIProvider {
  async listModels(): Promise<Array<string>> {
    if (!OPENAI_API_KEY) {
      return [];
    }
    try {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      const list = await openai.models.list();
      const models: Array<string> = [];
      for await (const model of list as AsyncIterable<{ id?: string }>) {
        if (model && typeof model.id === "string") {
          models.push(model.id);
        }
      }
      return models.sort();
    } catch {
      return [];
    }
  }

  createClient(): OpenAI {
    return new OpenAI({ apiKey: OPENAI_API_KEY });
  }
}

class AnthropicProvider implements AIProvider {
  async listModels(): Promise<Array<string>> {
    // Anthropic SDK does not have a model list API, so we return a hardcoded list
    return Promise.resolve([
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ]);
  }

  createClient(): Anthropic {
    return new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
}

class GoogleProvider implements AIProvider {
  async listModels(): Promise<Array<string>> {
    if (!GOOGLE_API_KEY) {
      return [];
    }
    try {
      const google = new GoogleGenerativeAI(GOOGLE_API_KEY);
      // Not a public API, but it's the only way to get the models list
      const models =
        await google.getGenerativeModel({ model: "" })["listModels"]?.();
      return models?.models?.map((m: { name: string }) => m.name) ?? [];
    } catch {
      return [];
    }
  }

  createClient(): GoogleGenerativeAI {
    return new GoogleGenerativeAI(GOOGLE_API_KEY);
  }
}

export function getProvider(providerName: AIProviderName): AIProvider {
  switch (providerName) {
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    case "google":
      return new GoogleProvider();
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}
