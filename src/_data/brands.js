/**
 * Brand Data Generator for Eleventy Pagination
 * Story 3.7: Create Basic Brand Page Access
 *
 * Extracts unique brands from codes.json and groups their codes
 * Used by src/brands/brand.njk for pagination
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Extract unique brands from codes data
 * @returns {Array} Array of brand objects with slug, name, and codes
 */
export default function() {
  // Read codes.json directly since Eleventy global data files
  // don't receive the data cascade as arguments
  const codesPath = join(__dirname, 'codes.json');
  let codesData;

  try {
    const content = readFileSync(codesPath, 'utf-8');
    codesData = JSON.parse(content);
  } catch (error) {
    // Log error as JSON per project-context.md, return empty array gracefully
    console.error(JSON.stringify({
      error: 'Failed to load codes.json for brand extraction',
      code: 'DATA_LOAD_ERROR',
      details: error.message
    }));
    return [];
  }

  const codes = codesData?.codes || [];
  const brandMap = new Map();

  for (const code of codes) {
    if (!code.brand_slug) continue;

    if (!brandMap.has(code.brand_slug)) {
      brandMap.set(code.brand_slug, {
        slug: code.brand_slug,
        name: code.brand_name || code.brand_slug,
        codes: []
      });
    }
    brandMap.get(code.brand_slug).codes.push(code);
  }

  // Sort brands alphabetically by name (French locale)
  return Array.from(brandMap.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}
