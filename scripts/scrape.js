/**
 * YouTube Scraper - Main Entry Point
 * Story 2.2: Implement YouTube Scraper with Adapter Pattern
 *
 * Scrapes YouTube FR videos for promo codes using keyword filtering.
 * Stores raw video data in SQLite for parsing.
 *
 * Exit codes:
 * - 0: Success
 * - 1: Recoverable error (API failure, quota exceeded)
 * - 2: Configuration error (missing API key)
 */

import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { YouTubeAdapter, KEYWORDS, DAILY_QUOTA_LIMIT } from './adapters/youtube-adapter.js';

const DB_PATH = process.env.CROWD_CODES_DB_PATH || 'data/codes.db';

/**
 * Ensure database has raw_videos table for storing scraped data
 * @param {Database} db - SQLite database instance
 */
function ensureRawVideosTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS raw_videos (
      video_id TEXT PRIMARY KEY,
      channel_name TEXT NOT NULL,
      description TEXT NOT NULL,
      published_at TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'youtube',
      scraped_at TEXT NOT NULL,
      parsed INTEGER DEFAULT 0
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_raw_videos_scraped_at
    ON raw_videos(scraped_at)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_raw_videos_parsed
    ON raw_videos(parsed)
  `);
}

/**
 * Create prepared statement for storing videos
 * @param {Database} db - SQLite database instance
 * @returns {Statement} Prepared statement for upsert
 */
function createStoreVideoStatement(db) {
  return db.prepare(`
    INSERT INTO raw_videos (video_id, channel_name, description, published_at, source_type, scraped_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(video_id) DO UPDATE SET
      description = excluded.description,
      scraped_at = excluded.scraped_at
  `);
}

/**
 * Store video in database using prepared statement
 * @param {Statement} stmt - Prepared statement
 * @param {Object} video - InternalVideoModel
 * @param {string} scrapedAt - ISO 8601 timestamp
 * @returns {boolean} True if row was inserted or updated
 */
function storeVideo(stmt, video, scrapedAt) {
  const result = stmt.run(
    video.video_id,
    video.channel_name,
    video.description,
    video.published_at,
    video.source_type,
    scrapedAt
  );

  return result.changes > 0;
}

/**
 * Run the YouTube scraper
 * @param {Object} options - Scraper options
 * @param {string} options.apiKey - YouTube API key (defaults to env var)
 * @param {string} options.dbPath - Database path (defaults to DB_PATH)
 * @param {number} options.lookbackHours - Hours to look back (default 24)
 * @returns {Promise<{success: boolean, videosFound: number, videosStored: number, quotaUsed: number}>}
 */
export async function runScraper(options = {}) {
  const apiKey = options.apiKey || process.env.YOUTUBE_API_KEY;
  const dbPath = options.dbPath || DB_PATH;
  const lookbackHours = options.lookbackHours || 24;

  // Validate API key
  if (!apiKey) {
    console.error(
      JSON.stringify({
        error: 'YOUTUBE_API_KEY environment variable is required',
        code: 'CONFIG_ERROR',
      })
    );
    return { success: false, videosFound: 0, videosStored: 0, quotaUsed: 0 };
  }

  // Validate database exists
  if (!existsSync(dbPath)) {
    console.error(
      JSON.stringify({
        error: `Database not found at ${dbPath}. Run 'npm run db:init' first.`,
        code: 'CONFIG_ERROR',
      })
    );
    return { success: false, videosFound: 0, videosStored: 0, quotaUsed: 0 };
  }

  let db = null;
  let adapter = null;

  try {
    // Initialize adapter
    adapter = new YouTubeAdapter(apiKey);

    // Open database
    db = new Database(dbPath);
    ensureRawVideosTable(db);

    // Calculate lookback time
    const publishedAfter = new Date(
      Date.now() - lookbackHours * 60 * 60 * 1000
    ).toISOString();

    console.log(
      JSON.stringify({
        event: 'scrape_start',
        keywords: KEYWORDS,
        published_after: publishedAfter,
        quota_limit: DAILY_QUOTA_LIMIT,
      })
    );

    // Fetch videos
    const videos = await adapter.fetchVideos(KEYWORDS, {
      publishedAfter,
      maxResults: 50,
    });

    const scrapedAt = new Date().toISOString();
    let videosStored = 0;

    // Create prepared statement once (performance optimization)
    const storeStmt = createStoreVideoStatement(db);

    // Store videos in database
    const transaction = db.transaction(() => {
      for (const video of videos) {
        const stored = storeVideo(storeStmt, video, scrapedAt);
        if (stored) {
          videosStored++;
        }
      }
    });

    transaction();

    const quotaUsed = adapter.getQuotaUsed();

    console.log(
      JSON.stringify({
        event: 'scrape_complete',
        videos_found: videos.length,
        videos_stored: videosStored,
        quota_used: quotaUsed,
        quota_remaining: DAILY_QUOTA_LIMIT - quotaUsed,
      })
    );

    return {
      success: true,
      videosFound: videos.length,
      videosStored,
      quotaUsed,
    };
  } catch (error) {
    const isQuotaError = error.message.includes('Quota exceeded');
    const isApiError =
      error.message.includes('YouTube API') ||
      error.message.includes('fetch failed');

    console.error(
      JSON.stringify({
        error: error.message,
        code: isQuotaError ? 'QUOTA_EXCEEDED' : isApiError ? 'API_ERROR' : 'SCRAPE_ERROR',
        quota_used: adapter?.getQuotaUsed() || 0,
      })
    );

    return {
      success: false,
      videosFound: 0,
      videosStored: 0,
      quotaUsed: adapter?.getQuotaUsed() || 0,
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
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('scrape.js');

if (isMainModule) {
  runScraper()
    .then((result) => {
      if (!result.success) {
        // Check if it's a config error
        const isConfigError =
          !process.env.YOUTUBE_API_KEY || !existsSync(DB_PATH);
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
