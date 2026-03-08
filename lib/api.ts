/**
 * Claude API client.
 *
 * Security: The Anthropic SDK is used in React Native (not browser) context.
 * The API key is retrieved from SecureStore at call time — never bundled or logged.
 * dangerouslyAllowBrowser is NOT set. The SDK works correctly in RN's JS environment.
 *
 * Image compression: All photos are compressed via lib/compression.ts before
 * being sent to the API (max 1920px / 2048px for SLAB, JPEG 85%).
 */

import Anthropic from '@anthropic-ai/sdk';
import { Category, Protocol } from '../types/item';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import { getModelForProtocol } from './models';
import { compressImageToBase64 } from './compression';
import { getApiKey } from './storage';

const MAX_TOKENS_CORE = 4096;
const MAX_TOKENS_QUICK = 1500;

export type AnalysisProgressStep =
  | 'uploading'
  | 'identifying'
  | 'comps'
  | 'listings'
  | 'record';

export interface AnalysisCallbacks {
  onProgress?: (step: AnalysisProgressStep) => void;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean = false,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Core analysis function.
 * Retrieves the API key from SecureStore, compresses images, calls Claude.
 */
export async function analyzeItem(
  category: Category,
  protocol: Protocol,
  photoUris: string[],
  callbacks?: AnalysisCallbacks
): Promise<Record<string, unknown>> {
  // Retrieve API key from SecureStore at call time — never stored in JS bundle
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new ApiError(
      'No API key configured. Please add your Anthropic API key in Settings.',
      false
    );
  }

  // React Native is not a browser environment — no dangerouslyAllowBrowser needed
  const client = new Anthropic({ apiKey });

  callbacks?.onProgress?.('uploading');

  // Compress all images before encoding
  const imageBlocks: Anthropic.ImageBlockParam[] = [];
  for (const uri of photoUris) {
    const { data, mediaType } = await compressImageToBase64(uri, category);
    imageBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data,
      },
    });
  }

  callbacks?.onProgress?.('identifying');

  const userPromptText = buildUserPrompt(category, protocol, photoUris.length);
  const content: Anthropic.ContentBlockParam[] = [
    ...imageBlocks,
    { type: 'text', text: userPromptText },
  ];

  if (protocol === 'core') {
    callbacks?.onProgress?.('comps');
  }

  try {
    const model = getModelForProtocol(protocol);
    const response = await client.messages.create({
      model,
      max_tokens: protocol === 'core' ? MAX_TOKENS_CORE : MAX_TOKENS_QUICK,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    if (protocol === 'core') {
      callbacks?.onProgress?.('listings');
    }

    callbacks?.onProgress?.('record');

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new ApiError('No text response from AI', false);
    }

    let jsonText = textBlock.text.trim();
    // Strip any accidental markdown code fences
    jsonText = jsonText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');

    return JSON.parse(jsonText) as Record<string, unknown>;
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      throw new ApiError('Rate limit reached. Please wait a moment and try again.', true, 429);
    }
    if (err instanceof Anthropic.AuthenticationError) {
      throw new ApiError(
        'Invalid API key. Please check your Anthropic API key in Settings.',
        false,
        401
      );
    }
    if (err instanceof Anthropic.APIStatusError) {
      const retryable = err.status >= 500;
      throw new ApiError(
        `API error (${err.status}). ${retryable ? 'Please try again.' : 'Contact support if this persists.'}`,
        retryable,
        err.status
      );
    }
    if (err instanceof SyntaxError) {
      throw new ApiError('Failed to parse AI response. Please try again.', true);
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError('Unexpected error during analysis. Please try again.', true);
  }
}

/**
 * Wrapper with a single automatic retry on retryable errors.
 */
export async function analyzeItemWithRetry(
  category: Category,
  protocol: Protocol,
  photoUris: string[],
  callbacks?: AnalysisCallbacks
): Promise<Record<string, unknown>> {
  try {
    return await analyzeItem(category, protocol, photoUris, callbacks);
  } catch (err) {
    if (err instanceof ApiError && err.retryable) {
      return await analyzeItem(category, protocol, photoUris, callbacks);
    }
    throw err;
  }
}

/**
 * Validate an API key by making a minimal test call.
 * Returns null on success or an error message string on failure.
 */
export async function validateApiKey(key: string): Promise<string | null> {
  try {
    const client = new Anthropic({ apiKey: key });
    await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Reply with: OK' }],
    });
    return null;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return 'Invalid API key. Please check and try again.';
    }
    if (err instanceof Anthropic.RateLimitError) {
      return 'Key is valid but rate limited. Try again in a moment.';
    }
    return 'Could not validate key. Check your connection and try again.';
  }
}
