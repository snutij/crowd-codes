/**
 * Code Parser - Main Entry Point
 * Story 2.3: Implement Regex-Based Code Parser
 *
 * Parses raw video descriptions to extract promo codes.
 * Uses regex patterns as primary parser.
 * Stores results in SQLite database.
 *
 * Exit codes:
 * - 0: Success
 * - 1: Recoverable error (DB error, parse failure)
 * - 2: Configuration error (missing files)
 */

import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { RegexParser } from './parsers/regex-parser.js';

const DB_PATH = process.env.CROWD_CODES_DB_PATH || 'data/codes.db';
const PATTERNS_PATH = process.env.PATTERNS_PATH || 'data/patterns.json';

/**
 * Create prepared statements for database operations
 * @param {Database} db - SQLite database instance
 * @returns {Object} Object with prepared statements
 */
function createStatements(db) {
  return {
    // Get unparsed videos
    getUnparsedVideos: db.prepare(`
      SELECT video_id, channel_name, description, published_at
      FROM raw_videos
      WHERE parsed = 0
      ORDER BY scraped_at DESC
    `),

    // Check if code already exists
    codeExists: db.prepare(`
      SELECT 1 FROM codes WHERE id = ?
    `),

    // Insert code (with conflict handling)
    insertCode: db.prepare(`
      INSERT INTO codes (id, code, brand_name, brand_slug, source_type, source_channel, source_video_id, found_at, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        confidence = MAX(confidence, excluded.confidence)
    `),

    // Insert brand (only if new)
    insertBrand: db.prepare(`
      INSERT INTO brands (slug, name, first_seen_at, code_count)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(slug) DO UPDATE SET
        code_count = code_count + 1
    `),

    // Insert parsing log
    insertLog: db.prepare(`
      INSERT INTO parsing_logs (video_id, description, parsed_by, suggested_regex, created_at)
      VALUES (?, ?, ?, ?, ?)
    `),

    // Mark video as parsed
    markParsed: db.prepare(`
      UPDATE raw_videos SET parsed = 1 WHERE video_id = ?
    `),
  };
}

/**
 * Process a single video description
 * @param {Object} video - Video record from raw_videos
 * @param {RegexParser} parser - Parser instance
 * @param {Object} statements - Prepared statements
 * @param {string} timestamp - Current timestamp
 * @returns {{codesFound: number, success: boolean}}
 */
function processVideo(video, parser, statements, timestamp) {
  // Validate required video fields
  if (!video || !video.video_id) {
    return { codesFound: 0, success: false };
  }

  const codes = parser.parseDescription(video.description || '', video.video_id);

  if (codes.length > 0) {
    // Store each extracted code
    for (const code of codes) {
      // Check if code already exists (to avoid over-incrementing brand count)
      const exists = statements.codeExists.get(code.id);

      // Insert code
      statements.insertCode.run(
        code.id,
        code.code,
        code.brand_name,
        code.brand_slug,
        'youtube',
        video.channel_name || 'Unknown',
        video.video_id,
        timestamp,
        code.confidence
      );

      // Only update brand count for truly new codes
      if (!exists) {
        statements.insertBrand.run(
          code.brand_slug,
          code.brand_name,
          timestamp
        );
      }
    }

    // Log successful parse
    statements.insertLog.run(
      video.video_id,
      video.description.slice(0, 1000), // Truncate for storage
      'regex',
      codes.map((c) => c.pattern_id).join(','),
      timestamp
    );
  } else {
    // Log failed parse (for LLM fallback queue)
    statements.insertLog.run(
      video.video_id,
      video.description.slice(0, 1000),
      'none', // Will be picked up by LLM fallback
      null,
      timestamp
    );
  }

  // Mark video as processed
  statements.markParsed.run(video.video_id);

  return {
    codesFound: codes.length,
    success: true,
  };
}

/**
 * Run the parser on all unparsed videos
 * @param {Object} options - Parser options
 * @param {string} options.dbPath - Database path
 * @param {string} options.patternsPath - Patterns file path
 * @returns {Promise<{success: boolean, videosProcessed: number, codesExtracted: number, failedParses: number}>}
 */
export async function runParser(options = {}) {
  const dbPath = options.dbPath || DB_PATH;
  const patternsPath = options.patternsPath || PATTERNS_PATH;

  // Validate files exist
  if (!existsSync(dbPath)) {
    console.error(
      JSON.stringify({
        error: `Database not found at ${dbPath}. Run 'npm run db:init' first.`,
        code: 'CONFIG_ERROR',
      })
    );
    return { success: false, videosProcessed: 0, codesExtracted: 0, failedParses: 0 };
  }

  if (!existsSync(patternsPath)) {
    console.error(
      JSON.stringify({
        error: `Patterns file not found at ${patternsPath}.`,
        code: 'CONFIG_ERROR',
      })
    );
    return { success: false, videosProcessed: 0, codesExtracted: 0, failedParses: 0 };
  }

  let db = null;

  try {
    // Initialize parser
    const parser = new RegexParser(patternsPath);

    console.log(
      JSON.stringify({
        event: 'parse_start',
        patterns_loaded: parser.getPatterns().length,
      })
    );

    // Open database
    db = new Database(dbPath);
    const statements = createStatements(db);

    // Get unparsed videos
    const videos = statements.getUnparsedVideos.all();

    if (videos.length === 0) {
      console.log(
        JSON.stringify({
          event: 'parse_complete',
          videos_processed: 0,
          codes_extracted: 0,
          message: 'No unparsed videos found',
        })
      );
      return { success: true, videosProcessed: 0, codesExtracted: 0, failedParses: 0 };
    }

    const timestamp = new Date().toISOString();
    let videosProcessed = 0;
    let codesExtracted = 0;
    let failedParses = 0;

    // Process in transaction for atomicity
    const processAll = db.transaction(() => {
      for (const video of videos) {
        try {
          const result = processVideo(video, parser, statements, timestamp);
          videosProcessed++;
          codesExtracted += result.codesFound;

          if (result.codesFound === 0) {
            failedParses++;
          }
        } catch (error) {
          console.error(
            JSON.stringify({
              error: error.message,
              code: 'PARSE_ERROR',
              video_id: video.video_id,
            })
          );
        }
      }
    });

    processAll();

    console.log(
      JSON.stringify({
        event: 'parse_complete',
        videos_processed: videosProcessed,
        codes_extracted: codesExtracted,
        failed_parses: failedParses,
        success_rate: videosProcessed > 0
          ? ((videosProcessed - failedParses) / videosProcessed * 100).toFixed(1) + '%'
          : 'N/A',
      })
    );

    return {
      success: true,
      videosProcessed,
      codesExtracted,
      failedParses,
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        error: error.message,
        code: 'PARSE_ERROR',
      })
    );

    return {
      success: false,
      videosProcessed: 0,
      codesExtracted: 0,
      failedParses: 0,
    };
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
  runParser()
    .then((result) => {
      if (!result.success) {
        const isConfigError =
          !existsSync(DB_PATH) || !existsSync(PATTERNS_PATH);
        process.exit(isConfigError ? 2 : 1);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error(
        JSON.stringify({
          error: error.message,
          code: 'UNEXPECTED_ERROR',
        })
      );
      process.exit(1);
    });
}
