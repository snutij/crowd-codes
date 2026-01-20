/**
 * LLM Parser - Gemini Flash fallback for code extraction
 * Story 2.4: Implement LLM Fallback Parser
 *
 * Uses Gemini Flash API as fallback when regex patterns don't match.
 * Includes quota management to stay within free tier limits.
 */

import { generateSlug, generateCodeId } from './regex-parser.js';

/**
 * Daily quota limit for Gemini API calls (free tier)
 */
export const DAILY_QUOTA_LIMIT = 150;

/**
 * Fetch timeout in milliseconds
 */
export const FETCH_TIMEOUT_MS = 30000;

/**
 * Gemini API endpoint
 */
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Prompt template for code extraction
 */
const PROMPT_TEMPLATE = `Tu es un assistant spécialisé dans l'extraction de codes promo depuis des descriptions YouTube françaises.

Analyse cette description et extrais les codes promo:

---
{description}
---

Retourne UNIQUEMENT un JSON valide avec ce format exact (pas de texte avant ou après):
{
  "codes": [
    {
      "code": "CODE123",
      "brand_name": "NomMarque",
      "confidence": 0.9
    }
  ],
  "suggested_regex": "pattern regex pour matcher ce type de code ou null",
  "reasoning": "courte explication de ton analyse"
}

Règles:
- Les codes promo sont généralement en MAJUSCULES
- Ils contiennent souvent des chiffres (ex: NIKE15, SUMMER20)
- Cherche les mots-clés: code, promo, réduction, coupon, -X%
- Si aucun code trouvé, retourne: { "codes": [], "suggested_regex": null, "reasoning": "..." }
- Pour suggested_regex, propose un pattern JavaScript valide qui pourrait matcher ce type de code`;

/**
 * Validate a regex pattern for syntax errors
 * @param {string} pattern - Regex pattern to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateRegex(pattern) {
  if (!pattern || typeof pattern !== 'string' || pattern.trim() === '') {
    return false;
  }

  try {
    new RegExp(pattern, 'gi');
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse Gemini API response and extract structured data
 * @param {Object} response - Raw Gemini API response
 * @returns {{success: boolean, codes: Array, suggested_regex: string|null, reasoning: string, error?: string}}
 */
export function parseGeminiResponse(response) {
  if (!response || !response.candidates || response.candidates.length === 0) {
    return {
      success: false,
      codes: [],
      suggested_regex: null,
      reasoning: '',
      error: 'Empty or invalid response',
    };
  }

  try {
    const candidate = response.candidates[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      return {
        success: false,
        codes: [],
        suggested_regex: null,
        reasoning: '',
        error: 'No text in response',
      };
    }

    // Try to extract JSON from the response (handle markdown code blocks)
    let jsonText = text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const data = JSON.parse(jsonText);

    return {
      success: true,
      codes: Array.isArray(data.codes) ? data.codes : [],
      suggested_regex: data.suggested_regex || null,
      reasoning: data.reasoning || '',
    };
  } catch (error) {
    return {
      success: false,
      codes: [],
      suggested_regex: null,
      reasoning: '',
      error: `JSON parse error: ${error.message}`,
    };
  }
}

/**
 * Fetch with timeout using AbortController
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * LLM Parser class for Gemini-based code extraction
 */
export class LlmParser {
  /**
   * Create an LlmParser instance
   * @param {string} apiKey - Gemini API key
   * @throws {Error} If API key is missing
   */
  constructor(apiKey) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.apiKey = apiKey;
    this.callsToday = 0;
  }

  /**
   * Check if daily quota is exhausted
   * @returns {boolean}
   */
  isQuotaExhausted() {
    return this.callsToday >= DAILY_QUOTA_LIMIT;
  }

  /**
   * Get remaining API calls for today
   * @returns {number}
   */
  getCallsRemaining() {
    return Math.max(0, DAILY_QUOTA_LIMIT - this.callsToday);
  }

  /**
   * Increment the call counter
   */
  incrementCallCount() {
    this.callsToday++;
  }

  /**
   * Build the prompt for Gemini API
   * @param {string} description - Video description to analyze
   * @returns {string} Formatted prompt
   */
  buildPrompt(description) {
    return PROMPT_TEMPLATE.replace('{description}', description);
  }

  /**
   * Parse a description using Gemini Flash API
   * @param {string} description - Video description text
   * @param {string} videoId - Video ID for code ID generation
   * @returns {Promise<{success: boolean, codes: Array, suggested_regex: string|null, reason?: string}>}
   */
  async parseDescription(description, videoId) {
    // Check quota
    if (this.isQuotaExhausted()) {
      return {
        success: false,
        codes: [],
        suggested_regex: null,
        reason: 'quota_exhausted',
      };
    }

    // Validate input
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return {
        success: false,
        codes: [],
        suggested_regex: null,
        reason: 'empty_description',
      };
    }

    try {
      const prompt = this.buildPrompt(description);

      const requestBody = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      };

      const response = await fetchWithTimeout(
        `${GEMINI_API_URL}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      // Only count successful API calls (response received)
      this.incrementCallCount();

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          codes: [],
          suggested_regex: null,
          reason: 'api_error',
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      const parsed = parseGeminiResponse(data);

      if (!parsed.success) {
        return {
          success: false,
          codes: [],
          suggested_regex: null,
          reason: 'parse_error',
          error: parsed.error,
        };
      }

      // Process extracted codes
      const processedCodes = parsed.codes.map((code) => {
        const brandSlug = generateSlug(code.brand_name);
        return {
          code: (code.code || '').toUpperCase().trim(),
          brand_name: code.brand_name || 'Unknown',
          brand_slug: brandSlug,
          confidence: code.confidence || 0.7,
          pattern_id: 'llm-extraction',
          id: generateCodeId(code.code, brandSlug, videoId),
        };
      });

      // Validate suggested regex if present
      const validatedRegex =
        parsed.suggested_regex && validateRegex(parsed.suggested_regex)
          ? parsed.suggested_regex
          : null;

      return {
        success: true,
        codes: processedCodes,
        suggested_regex: validatedRegex,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        return {
          success: false,
          codes: [],
          suggested_regex: null,
          reason: 'timeout',
          error: 'Request timed out',
        };
      }

      return {
        success: false,
        codes: [],
        suggested_regex: null,
        reason: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get current quota status
   * @returns {{calls_made: number, calls_remaining: number, is_exhausted: boolean}}
   */
  getQuotaStatus() {
    return {
      calls_made: this.callsToday,
      calls_remaining: this.getCallsRemaining(),
      is_exhausted: this.isQuotaExhausted(),
    };
  }
}

/**
 * Factory function to create LlmParser from environment
 * @returns {LlmParser|null} Parser instance or null if API key not set
 */
export function createLlmParser() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new LlmParser(apiKey);
}
