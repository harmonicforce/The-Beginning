import Anthropic from '@anthropic-ai/sdk';
import * as FileSystem from 'expo-file-system';
import { Category, Protocol } from '../types/item';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';

const MODEL = 'claude-sonnet-4-0';
const MAX_TOKENS_CORE = 4000;
const MAX_TOKENS_QUICK = 1500;
const MAX_IMAGE_DIMENSION = 1920;

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

async function readImageAsBase64(uri: string): Promise<{ data: string; mediaType: string }> {
  // Determine media type from extension
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mediaTypeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  const mediaType = mediaTypeMap[ext] ?? 'image/jpeg';

  const data = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return { data, mediaType };
}

export async function analyzeItem(
  apiKey: string,
  category: Category,
  protocol: Protocol,
  photoUris: string[],
  callbacks?: AnalysisCallbacks
): Promise<Record<string, unknown>> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  callbacks?.onProgress?.('uploading');

  // Build image content blocks
  const imageBlocks: Anthropic.ImageBlockParam[] = [];
  for (const uri of photoUris) {
    const { data, mediaType } = await readImageAsBase64(uri);
    imageBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
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
    const response = await client.messages.create({
      model: MODEL,
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
      throw new ApiError('Invalid API key. Please check your Anthropic API key in Settings.', false, 401);
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

export async function analyzeItemWithRetry(
  apiKey: string,
  category: Category,
  protocol: Protocol,
  photoUris: string[],
  callbacks?: AnalysisCallbacks
): Promise<Record<string, unknown>> {
  try {
    return await analyzeItem(apiKey, category, protocol, photoUris, callbacks);
  } catch (err) {
    if (err instanceof ApiError && err.retryable) {
      // Single automatic retry
      return await analyzeItem(apiKey, category, protocol, photoUris, callbacks);
    }
    throw err;
  }
}
