/**
 * Database Initialization Script
 * Story 2.1: Create SQLite Database Schema
 *
 * Creates the SQLite database with tables for:
 * - codes: Promo codes extracted from YouTube videos
 * - brands: Aggregated brand information
 * - parsing_logs: Logs for self-improvement system
 * - raw_videos: Raw scraped YouTube videos for parsing
 *
 * This script is idempotent - safe to run multiple times.
 *
 * Exit codes:
 * - 0: Success
 * - 1: Recoverable error (retry possible)
 * - 2: Configuration error (needs manual fix)
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = process.env.CROWD_CODES_DB_PATH || 'data/codes.db';

/**
 * Initialize the database with all required tables and indexes.
 * Uses IF NOT EXISTS for idempotent execution.
 *
 * @param {string} dbPath - Path to the SQLite database file
 * @returns {boolean} - True if successful
 */
export function initializeDatabase(dbPath = DB_PATH) {
  let db = null;

  try {
    // Ensure data directory exists
    const dataDir = dirname(dbPath);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create codes table - main data storage for promo codes
    db.exec(`
      CREATE TABLE IF NOT EXISTS codes (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        brand_name TEXT NOT NULL,
        brand_slug TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_channel TEXT,
        source_video_id TEXT,
        found_at TEXT NOT NULL,
        confidence REAL DEFAULT 1.0
      )
    `);

    // Create brands table - aggregated brand information
    db.exec(`
      CREATE TABLE IF NOT EXISTS brands (
        slug TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        first_seen_at TEXT NOT NULL,
        code_count INTEGER DEFAULT 0
      )
    `);

    // Create parsing_logs table - for self-improvement system
    db.exec(`
      CREATE TABLE IF NOT EXISTS parsing_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT NOT NULL,
        description TEXT NOT NULL,
        parsed_by TEXT NOT NULL,
        suggested_regex TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // Create raw_videos table - for storing scraped YouTube videos
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

    // Create indexes for performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_codes_brand_slug ON codes(brand_slug)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_codes_found_at ON codes(found_at)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_parsing_logs_created_at ON parsing_logs(created_at)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_raw_videos_scraped_at ON raw_videos(scraped_at)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_raw_videos_parsed ON raw_videos(parsed)
    `);

    db.close();
    db = null;

    // Log success in JSON format per project standards
    console.log(
      JSON.stringify({
        event: 'db_init_complete',
        path: dbPath,
        tables: ['codes', 'brands', 'parsing_logs', 'raw_videos'],
        indexes: [
          'idx_codes_brand_slug',
          'idx_codes_found_at',
          'idx_parsing_logs_created_at',
          'idx_raw_videos_scraped_at',
          'idx_raw_videos_parsed',
        ],
      })
    );

    return true;
  } catch (error) {
    // Ensure database is closed on error
    if (db) {
      try {
        db.close();
      } catch {
        // Ignore close errors
      }
    }

    // Log error in JSON format per project standards
    const isConfigError =
      error.code === 'EACCES' ||
      error.code === 'ENOENT' ||
      error.message.includes('permission');

    console.error(
      JSON.stringify({
        error: error.message,
        code: isConfigError ? 'CONFIG_ERROR' : 'DB_ERROR',
        path: dbPath,
      })
    );

    // Exit with appropriate code
    process.exit(isConfigError ? 2 : 1);
  }
}

// Run initialization when executed directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('init-db.js');

if (isMainModule) {
  initializeDatabase();
}
