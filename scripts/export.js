/**
 * JSON Export Script
 * Story 2.5: Implement JSON Export for Eleventy
 *
 * Exports codes from SQLite database to JSON format for Eleventy.
 * Generates src/_data/codes.json with meta and codes array.
 *
 * Exit codes:
 * - 0: Success
 * - 1: Recoverable error (DB read failure)
 * - 2: Configuration error (DB not found)
 */

import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = process.env.CROWD_CODES_DB_PATH || 'data/codes.db';
const OUTPUT_PATH = 'src/_data/codes.json';

/**
 * Run the JSON export
 * @param {Object} options - Export options
 * @param {string} options.dbPath - Database path
 * @param {string} options.outputPath - Output JSON path
 * @returns {{success: boolean, totalCodes?: number, totalBrands?: number}}
 */
export function runExport(options = {}) {
  const dbPath = options.dbPath || DB_PATH;
  const outputPath = options.outputPath || OUTPUT_PATH;

  // Validate database exists
  if (!existsSync(dbPath)) {
    console.error(
      JSON.stringify({
        error: `Database not found at ${dbPath}`,
        code: 'CONFIG_ERROR',
      })
    );
    return { success: false };
  }

  let db = null;

  try {
    // Open database in read-only mode
    db = new Database(dbPath, { readonly: true });

    // Prepare statements
    const getCodes = db.prepare(`
      SELECT id, code, brand_name, brand_slug, source_type,
             source_channel, source_video_id, found_at, confidence
      FROM codes
      ORDER BY found_at DESC
    `);

    const getBrandsCount = db.prepare(`
      SELECT COUNT(*) as count FROM brands
    `);

    // Execute queries
    const codes = getCodes.all();
    const brandsResult = getBrandsCount.get();
    const totalBrands = brandsResult ? brandsResult.count : 0;

    // Build JSON structure
    const output = {
      meta: {
        generated_at: new Date().toISOString(),
        total_codes: codes.length,
        total_brands: totalBrands,
      },
      codes: codes.map((code) => ({
        id: code.id,
        code: code.code,
        brand_name: code.brand_name,
        brand_slug: code.brand_slug,
        source_type: code.source_type,
        source_channel: code.source_channel,
        source_video_id: code.source_video_id,
        found_at: code.found_at,
        confidence: code.confidence,
      })),
    };

    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Write JSON file with 2-space indentation
    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

    // Log export stats
    console.log(
      JSON.stringify({
        event: 'export_complete',
        total_codes: codes.length,
        total_brands: totalBrands,
        output_path: outputPath,
      })
    );

    return {
      success: true,
      totalCodes: codes.length,
      totalBrands: totalBrands,
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        error: error.message,
        code: 'DB_READ_ERROR',
      })
    );
    return { success: false };
  } finally {
    if (db) {
      try {
        db.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runExport();
  if (!result.success) {
    const isConfigError = !existsSync(DB_PATH);
    process.exit(isConfigError ? 2 : 1);
  }
  process.exit(0);
}
