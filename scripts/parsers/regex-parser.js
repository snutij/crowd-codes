/**
 * Regex Parser - Pattern-based promo code extraction
 * Story 2.3: Implement Regex-Based Code Parser
 *
 * Extracts promo codes from video descriptions using predefined patterns.
 * Primary parser before LLM fallback.
 */

import { readFileSync } from 'fs';
import { createHash } from 'crypto';

/**
 * Parsed code result
 * @typedef {Object} ParsedCode
 * @property {string} code - The extracted promo code
 * @property {string} brand_name - Inferred or explicit brand name
 * @property {string} brand_slug - URL-safe brand slug
 * @property {number} confidence - Confidence score (0-1)
 * @property {string} pattern_id - ID of matching pattern
 */

/**
 * Pattern definition from patterns.json
 * @typedef {Object} Pattern
 * @property {string} id - Unique pattern identifier
 * @property {string} regex - Regex pattern string
 * @property {string|null} brand_hint - Brand hint ($1 for capture group, string for static, null for inference)
 * @property {number} confidence - Confidence score (0-1)
 * @property {RegExp} [compiled] - Compiled regex (added at runtime)
 */

const DEFAULT_PATTERNS_PATH = 'data/patterns.json';

/**
 * Load and validate patterns from JSON file
 * @param {string} path - Path to patterns.json
 * @returns {Pattern[]} Array of compiled patterns
 */
export function loadPatterns(path = DEFAULT_PATTERNS_PATH) {
  let content;
  try {
    content = readFileSync(path, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read patterns file at ${path}: ${error.message}`);
  }

  let data;
  try {
    data = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in patterns file ${path}: ${error.message}`);
  }

  if (!Array.isArray(data.patterns)) {
    throw new Error('Invalid patterns.json: missing patterns array');
  }

  return data.patterns.map((pattern) => ({
    ...pattern,
    compiled: new RegExp(pattern.regex, 'gi'),
  }));
}

/**
 * Generate URL-safe slug from brand name
 * @param {string} brandName - Brand name to convert
 * @returns {string} Kebab-case slug
 */
export function generateSlug(brandName) {
  if (!brandName || typeof brandName !== 'string') {
    return 'unknown';
  }

  const slug = brandName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
    .replace(/-+/g, '-'); // Collapse multiple hyphens

  return slug || 'unknown';
}

/**
 * Generate deterministic ID for a code
 * @param {string} code - Promo code
 * @param {string} brandSlug - Brand slug
 * @param {string} videoId - Source video ID
 * @returns {string} 16-character hex ID
 */
export function generateCodeId(code, brandSlug, videoId) {
  const content = `${code}:${brandSlug}:${videoId}`;
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Infer brand name from code pattern
 * Extracts alphabetic prefix from codes like "NIKE15" → "Nike"
 * @param {string} code - The promo code
 * @returns {string} Inferred brand name or "Unknown"
 */
function inferBrandFromCode(code) {
  // Extract alphabetic prefix (e.g., "NIKE" from "NIKE15")
  const match = code.match(/^([A-Z]{3,})/i);
  if (match) {
    const brand = match[1];
    // Capitalize first letter, lowercase rest
    return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  }
  return 'Unknown';
}

/**
 * RegexParser class for extracting promo codes from descriptions
 */
export class RegexParser {
  /**
   * Create a RegexParser instance
   * @param {string} patternsPath - Path to patterns.json
   */
  constructor(patternsPath = DEFAULT_PATTERNS_PATH) {
    this.patterns = loadPatterns(patternsPath);
  }

  /**
   * Parse a description for promo codes
   * @param {string} description - Video description text
   * @param {string} [videoId] - Optional video ID for code ID generation
   * @returns {ParsedCode[]} Array of extracted codes
   */
  parseDescription(description, videoId = 'unknown') {
    if (!description || typeof description !== 'string') {
      return [];
    }

    const results = new Map(); // Use Map to deduplicate by code

    for (const pattern of this.patterns) {
      // Reset regex lastIndex for global matching
      pattern.compiled.lastIndex = 0;

      let match;
      while ((match = pattern.compiled.exec(description)) !== null) {
        // Extract code from first capture group
        const code = (match[1] || '').toUpperCase().trim();

        if (!code || code.length < 3) {
          continue;
        }

        // Skip if we already found this code with higher confidence
        if (results.has(code) && results.get(code).confidence >= pattern.confidence) {
          continue;
        }

        // Determine brand name
        let brandName;
        if (pattern.brand_hint === '$1' && match[1]) {
          // Use first capture group as brand
          brandName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        } else if (pattern.brand_hint && pattern.brand_hint !== '$1') {
          // Use static brand hint
          brandName = pattern.brand_hint;
        } else {
          // Infer from code pattern
          brandName = inferBrandFromCode(code);
        }

        const brandSlug = generateSlug(brandName);

        results.set(code, {
          code,
          brand_name: brandName,
          brand_slug: brandSlug,
          confidence: pattern.confidence,
          pattern_id: pattern.id,
          id: generateCodeId(code, brandSlug, videoId),
        });
      }
    }

    return Array.from(results.values());
  }

  /**
   * Get all loaded patterns
   * @returns {Pattern[]} Array of patterns
   */
  getPatterns() {
    return this.patterns;
  }
}

/**
 * Factory function to create RegexParser
 * @param {string} patternsPath - Path to patterns.json
 * @returns {RegexParser} Parser instance
 */
export function createRegexParser(patternsPath) {
  return new RegexParser(patternsPath);
}
