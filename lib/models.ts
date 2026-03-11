/**
 * Anthropic model name constants.
 * Always reference these constants — never hardcode model strings.
 */

/** Primary model: Claude Sonnet 4.5 — used for CORE protocol analysis */
export const PRIMARY_MODEL = 'claude-sonnet-4-5-20251101';

/** Fallback/quick model: Claude Haiku 4.5 — used for QUICK protocol analysis */
export const QUICK_MODEL = 'claude-haiku-4-5-20251001';

/**
 * Returns the appropriate model for the given protocol.
 * QUICK uses Haiku for speed and cost. CORE uses Sonnet for quality.
 */
export function getModelForProtocol(protocol: 'quick' | 'core'): string {
  return protocol === 'quick' ? QUICK_MODEL : PRIMARY_MODEL;
}
