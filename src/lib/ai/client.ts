import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";

/**
 * Anthropic (Claude) backend primitives. The provider-agnostic layer in
 * provider.ts uses these when AI_PROVIDER is "anthropic"; for OpenAI-compatible
 * providers it talks to the endpoint directly.
 */

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!config.anthropic.apiKey) {
    throw new AiNotConfiguredError();
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: config.anthropic.apiKey });
  }
  return _client;
}

export class AiNotConfiguredError extends Error {
  code = "ai_not_configured";
  constructor() {
    super(
      "AI is not configured. Set ANTHROPIC_API_KEY (Claude), or AI_PROVIDER=openai with AI_BASE_URL/AI_API_KEY/AI_MODEL for a cheaper provider."
    );
  }
}

export const MODEL = () => config.anthropic.model;
