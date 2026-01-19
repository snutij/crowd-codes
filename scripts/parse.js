/**
 * Code Parser - Main Entry Point
 * Story 2.3 & 2.4: Regex + LLM Fallback Parser
 *
 * Parses raw video descriptions to extract promo codes.
 * Uses regex patterns as primary parser, LLM as fallback.
 * Stores results in SQLite database.
 *
 * Exit codes:
 * - 0: Success (even if quota exhausted - graceful degradation)
 * - 1: Recoverable error (DB error, parse failure)
 * - 2: Configuration error (missing files)
 */

import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { RegexParser } from './parsers/regex-parser.js';
import { LlmParser, createLlmParser } from './parsers/llm-parser.js';

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

    // Get videos that failed regex parsing (for LLM fallback)
    getUnparsedForLlm: db.prepare(`
      SELECT pl.video_id, rv.description, rv.channel_name
      FROM parsing_logs pl
      JOIN raw_videos rv ON pl.video_id = rv.video_id
      WHERE pl.parsed_by = 'none'
      ORDER BY pl.created_at DESC
      LIMIT ?
    `),

    // Update parsing log with LLM result
    updateLogWithLlm: db.prepare(`
      UPDATE parsing_logs
      SET parsed_by = 'llm', suggested_regex = ?
      WHERE video_id = ? AND parsed_by = 'none'
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
 * Process a single video with LLM fallback
 * @param {Object} video - Video record
 * @param {LlmParser} llmParser - LLM parser instance
 * @param {Database} db - Database instance for transactions
 * @param {Object} statements - Prepared statements
 * @param {string} timestamp - Current timestamp
 * @returns {Promise<{codesFound: number, success: boolean, suggested_regex: string|null}>}
 */
async function processVideoWithLlm(video, llmParser, db, statements, timestamp) {
  if (!video || !video.video_id) {
    return { codesFound: 0, success: false, suggested_regex: null };
  }

  const result = await llmParser.parseDescription(video.description || '', video.video_id);

  if (!result.success) {
    // Log quota exhaustion or error, but don't fail
    if (result.reason === 'quota_exhausted') {
      return { codesFound: 0, success: false, suggested_regex: null, quotaExhausted: true };
    }
    return { codesFound: 0, success: false, suggested_regex: null };
  }

  // Wrap all DB operations in a transaction for atomicity
  const storeResults = db.transaction(() => {
    if (result.codes.length > 0) {
      // Store each extracted code
      for (const code of result.codes) {
        const exists = statements.codeExists.get(code.id);

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

        if (!exists) {
          statements.insertBrand.run(
            code.brand_slug,
            code.brand_name,
            timestamp
          );
        }
      }
    }

    // Update parsing log with LLM result
    statements.updateLogWithLlm.run(
      result.suggested_regex || null,
      video.video_id
    );
  });

  storeResults();

  return {
    codesFound: result.codes.length,
    success: true,
    suggested_regex: result.suggested_regex,
  };
}

/**
 * Run LLM fallback on videos that failed regex parsing
 * @param {Database} db - Database instance
 * @param {Object} statements - Prepared statements
 * @param {LlmParser} llmParser - LLM parser instance
 * @returns {Promise<{videosProcessed: number, codesExtracted: number, suggestedRegex: number, quotaExhausted: boolean}>}
 */
async function runLlmFallback(db, statements, llmParser) {
  const timestamp = new Date().toISOString();
  const limit = llmParser.getCallsRemaining();

  if (limit === 0) {
    return { videosProcessed: 0, codesExtracted: 0, suggestedRegex: 0, quotaExhausted: true };
  }

  const videos = statements.getUnparsedForLlm.all(limit);

  if (videos.length === 0) {
    return { videosProcessed: 0, codesExtracted: 0, suggestedRegex: 0, quotaExhausted: false };
  }

  console.log(
    JSON.stringify({
      event: 'llm_fallback_start',
      videos_to_process: videos.length,
      quota_remaining: llmParser.getCallsRemaining(),
    })
  );

  let videosProcessed = 0;
  let codesExtracted = 0;
  let suggestedRegex = 0;
  let quotaExhausted = false;

  for (const video of videos) {
    if (llmParser.isQuotaExhausted()) {
      quotaExhausted = true;
      break;
    }

    try {
      const result = await processVideoWithLlm(video, llmParser, db, statements, timestamp);
      videosProcessed++;
      codesExtracted += result.codesFound;

      if (result.suggested_regex) {
        suggestedRegex++;
      }

      if (result.quotaExhausted) {
        quotaExhausted = true;
        break;
      }
    } catch (error) {
      console.error(
        JSON.stringify({
          error: error.message,
          code: 'LLM_PARSE_ERROR',
          video_id: video.video_id,
        })
      );
    }
  }

  return { videosProcessed, codesExtracted, suggestedRegex, quotaExhausted };
}

/**
 * Run the parser on all unparsed videos
 * @param {Object} options - Parser options
 * @param {string} options.dbPath - Database path
 * @param {string} options.patternsPath - Patterns file path
 * @param {boolean} options.skipLlm - Skip LLM fallback (for testing)
 * @returns {Promise<{success: boolean, videosProcessed: number, codesExtracted: number, failedParses: number, llm: Object}>}
 */
export async function runParser(options = {}) {
  const dbPath = options.dbPath || DB_PATH;
  const patternsPath = options.patternsPath || PATTERNS_PATH;
  const skipLlm = options.skipLlm || false;

  const defaultLlmResult = { videosProcessed: 0, codesExtracted: 0, suggestedRegex: 0, quotaExhausted: false };

  // Validate files exist
  if (!existsSync(dbPath)) {
    console.error(
      JSON.stringify({
        error: `Database not found at ${dbPath}. Run 'npm run db:init' first.`,
        code: 'CONFIG_ERROR',
      })
    );
    return { success: false, videosProcessed: 0, codesExtracted: 0, failedParses: 0, llm: defaultLlmResult };
  }

  if (!existsSync(patternsPath)) {
    console.error(
      JSON.stringify({
        error: `Patterns file not found at ${patternsPath}.`,
        code: 'CONFIG_ERROR',
      })
    );
    return { success: false, videosProcessed: 0, codesExtracted: 0, failedParses: 0, llm: defaultLlmResult };
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
      return { success: true, videosProcessed: 0, codesExtracted: 0, failedParses: 0, llm: defaultLlmResult };
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
        event: 'regex_parse_complete',
        videos_processed: videosProcessed,
        codes_extracted: codesExtracted,
        failed_parses: failedParses,
        success_rate: videosProcessed > 0
          ? ((videosProcessed - failedParses) / videosProcessed * 100).toFixed(1) + '%'
          : 'N/A',
      })
    );

    // Run LLM fallback if enabled and API key is set
    let llmResult = { videosProcessed: 0, codesExtracted: 0, suggestedRegex: 0, quotaExhausted: false };

    if (!skipLlm && failedParses > 0) {
      const llmParser = createLlmParser();

      if (llmParser) {
        llmResult = await runLlmFallback(db, statements, llmParser);

        console.log(
          JSON.stringify({
            event: 'llm_fallback_complete',
            videos_processed: llmResult.videosProcessed,
            codes_extracted: llmResult.codesExtracted,
            suggested_regex: llmResult.suggestedRegex,
            quota_exhausted: llmResult.quotaExhausted,
          })
        );
      } else {
        console.log(
          JSON.stringify({
            event: 'llm_fallback_skipped',
            reason: 'GEMINI_API_KEY not set',
          })
        );
      }
    }

    // Combined results
    const totalCodesExtracted = codesExtracted + llmResult.codesExtracted;

    console.log(
      JSON.stringify({
        event: 'parse_complete',
        regex: { videos: videosProcessed, codes: codesExtracted },
        llm: { videos: llmResult.videosProcessed, codes: llmResult.codesExtracted },
        total_codes: totalCodesExtracted,
      })
    );

    return {
      success: true,
      videosProcessed,
      codesExtracted,
      failedParses,
      llm: llmResult,
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
      llm: { videosProcessed: 0, codesExtracted: 0, suggestedRegex: 0, quotaExhausted: false },
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
