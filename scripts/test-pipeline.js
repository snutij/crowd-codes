#!/usr/bin/env node
/**
 * Test Pipeline - Run real scrape + parse with temp DB
 *
 * Uses the actual scrape.js and parse.js code with a temporary database.
 * Usage: npm run test:pipeline -- --limit 10
 */

import { existsSync, unlinkSync, copyFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import Database from 'better-sqlite3';

// Import the real functions
import { runScraper } from './scrape.js';
import { runParser } from './parse.js';

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: 10,
    skipLlm: false,
    keepDb: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === '--skip-llm') {
      options.skipLlm = true;
    }
    if (args[i] === '--keep-db') {
      options.keepDb = true;
    }
  }

  return options;
}

/**
 * Initialize a temporary database with schema
 */
function initTempDb(dbPath) {
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS raw_videos (
      video_id TEXT PRIMARY KEY,
      channel_name TEXT NOT NULL,
      description TEXT NOT NULL,
      published_at TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'youtube',
      scraped_at TEXT NOT NULL,
      parsed INTEGER DEFAULT 0
    );

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
    );

    CREATE TABLE IF NOT EXISTS brands (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      first_seen_at TEXT NOT NULL,
      code_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS parsing_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT NOT NULL,
      description TEXT,
      parsed_by TEXT NOT NULL,
      suggested_regex TEXT,
      created_at TEXT NOT NULL
    );
  `);

  db.close();
}

/**
 * Extract results from temp DB
 */
function extractResults(dbPath) {
  const db = new Database(dbPath, { readonly: true });

  const videos = db.prepare('SELECT * FROM raw_videos').all();
  const codes = db.prepare('SELECT * FROM codes').all();
  const brands = db.prepare('SELECT * FROM brands').all();
  const logs = db.prepare('SELECT * FROM parsing_logs').all();

  db.close();

  return { videos, codes, brands, logs };
}

async function main() {
  const options = parseArgs();
  const tempDbPath = join(tmpdir(), `crowd-codes-test-${Date.now()}.db`);

  console.error(`\n🧪 Test Pipeline (limit: ${options.limit}, skipLlm: ${options.skipLlm})`);
  console.error(`📁 Temp DB: ${tempDbPath}\n`);

  try {
    // 1. Init temp DB
    console.error('1️⃣  Initializing temp database...');
    initTempDb(tempDbPath);

    // 2. Run scraper (with limit via maxResults)
    console.error(`2️⃣  Running scraper (limit: ${options.limit})...`);

    // Temporarily patch the adapter to respect our limit
    const originalEnv = process.env.CROWD_CODES_DB_PATH;
    process.env.CROWD_CODES_DB_PATH = tempDbPath;

    const scrapeResult = await runScraper({
      dbPath: tempDbPath,
      lookbackHours: 24,
    });

    console.error(`   ✓ Scraped ${scrapeResult.videosFound} videos, stored ${scrapeResult.videosStored}`);

    // Limit videos in DB if we got more than requested
    if (scrapeResult.videosStored > options.limit) {
      const db = new Database(tempDbPath);
      const videoIds = db
        .prepare('SELECT video_id FROM raw_videos ORDER BY scraped_at DESC LIMIT ?')
        .all(options.limit)
        .map((r) => r.video_id);

      db.prepare(
        `DELETE FROM raw_videos WHERE video_id NOT IN (${videoIds.map(() => '?').join(',')})`
      ).run(...videoIds);

      console.error(`   ✓ Limited to ${options.limit} videos`);
      db.close();
    }

    // 3. Run parser
    console.error(`3️⃣  Running parser${options.skipLlm ? ' (LLM skipped)' : ''}...`);

    const parseResult = await runParser({
      dbPath: tempDbPath,
      skipLlm: options.skipLlm,
    });

    console.error(`   ✓ Regex: ${parseResult.codesExtracted} codes`);
    console.error(`   ✓ LLM: ${parseResult.llm.codesExtracted} codes`);

    // 4. Extract and output results
    console.error('4️⃣  Extracting results...\n');

    const results = extractResults(tempDbPath);

    const output = {
      options,
      stats: {
        videos_scraped: scrapeResult.videosStored,
        videos_parsed: parseResult.videosProcessed,
        codes_regex: parseResult.codesExtracted,
        codes_llm: parseResult.llm.codesExtracted,
        codes_total: results.codes.length,
        brands_found: results.brands.length,
      },
      brands: results.brands,
      codes: results.codes,
      parsing_logs: results.logs.map((l) => ({
        video_id: l.video_id,
        parsed_by: l.parsed_by,
        suggested_regex: l.suggested_regex,
      })),
    };

    console.log(JSON.stringify(output, null, 2));

    // Restore env
    process.env.CROWD_CODES_DB_PATH = originalEnv;

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Cleanup temp DB
    if (!options.keepDb && existsSync(tempDbPath)) {
      unlinkSync(tempDbPath);
      console.error(`\n🧹 Cleaned up temp DB`);
    } else if (options.keepDb) {
      console.error(`\n📁 Kept temp DB at: ${tempDbPath}`);
    }
  }
}

main();
