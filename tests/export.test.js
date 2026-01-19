/**
 * Export Script Tests
 * Story 2.5: Implement JSON Export for Eleventy
 *
 * Tests validate:
 * - JSON structure matches architecture spec
 * - Codes are sorted by found_at descending
 * - All fields use snake_case
 * - Empty database handling
 * - Export stats logging
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { dirname } from 'path';
import Database from 'better-sqlite3';

// Dynamic import for module under test
let runExport;

const TEST_DB_PATH = 'data/test-export.db';
const TEST_OUTPUT_PATH = 'src/_data/test-codes.json';

/**
 * Initialize test database with schema
 */
function initTestDb() {
  const db = new Database(TEST_DB_PATH);

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
    );

    CREATE TABLE IF NOT EXISTS brands (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      first_seen_at TEXT NOT NULL,
      code_count INTEGER DEFAULT 0
    );
  `);

  return db;
}

/**
 * Clean up test files
 */
function cleanup() {
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }
  if (existsSync(TEST_OUTPUT_PATH)) {
    unlinkSync(TEST_OUTPUT_PATH);
  }
}

describe('export.js module', () => {
  beforeEach(async () => {
    cleanup();
    try {
      const module = await import('../scripts/export.js');
      runExport = module.runExport;
    } catch {
      // Module not yet created - tests will fail as expected in RED phase
    }
  });

  afterEach(() => {
    cleanup();
  });

  test('runExport function exists', () => {
    assert.ok(runExport, 'runExport should be exported');
    assert.strictEqual(typeof runExport, 'function', 'Should be a function');
  });

  test('returns error when database does not exist', () => {
    const result = runExport({
      dbPath: 'nonexistent.db',
      outputPath: TEST_OUTPUT_PATH,
    });
    assert.strictEqual(result.success, false, 'Should fail when DB missing');
  });
});

describe('JSON structure validation', () => {
  let db;

  beforeEach(async () => {
    cleanup();
    db = initTestDb();

    // Insert test data
    db.prepare(`
      INSERT INTO codes (id, code, brand_name, brand_slug, source_type, source_channel, source_video_id, found_at, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('code1', 'PROMO10', 'TestBrand', 'testbrand', 'youtube', 'TestChannel', 'video123', '2026-01-19T10:00:00Z', 0.95);

    db.prepare(`
      INSERT INTO brands (slug, name, first_seen_at, code_count)
      VALUES (?, ?, ?, ?)
    `).run('testbrand', 'TestBrand', '2026-01-19T10:00:00Z', 1);

    db.close();

    try {
      const module = await import('../scripts/export.js');
      runExport = module.runExport;
    } catch {
      // Module not yet created
    }
  });

  afterEach(() => {
    cleanup();
  });

  test('exports valid JSON with meta and codes', () => {
    const result = runExport({
      dbPath: TEST_DB_PATH,
      outputPath: TEST_OUTPUT_PATH,
    });

    assert.ok(result.success, 'Export should succeed');
    assert.ok(existsSync(TEST_OUTPUT_PATH), 'Output file should exist');

    const json = JSON.parse(readFileSync(TEST_OUTPUT_PATH, 'utf-8'));
    assert.ok(json.meta, 'Should have meta object');
    assert.ok(Array.isArray(json.codes), 'Should have codes array');
  });

  test('meta contains required fields', () => {
    runExport({
      dbPath: TEST_DB_PATH,
      outputPath: TEST_OUTPUT_PATH,
    });

    const json = JSON.parse(readFileSync(TEST_OUTPUT_PATH, 'utf-8'));
    assert.ok(json.meta.generated_at, 'Should have generated_at');
    assert.strictEqual(typeof json.meta.total_codes, 'number', 'total_codes should be number');
    assert.strictEqual(typeof json.meta.total_brands, 'number', 'total_brands should be number');
  });

  test('code objects have all required fields', () => {
    runExport({
      dbPath: TEST_DB_PATH,
      outputPath: TEST_OUTPUT_PATH,
    });

    const json = JSON.parse(readFileSync(TEST_OUTPUT_PATH, 'utf-8'));
    const code = json.codes[0];

    assert.ok(code.id, 'Should have id');
    assert.ok(code.code, 'Should have code');
    assert.ok(code.brand_name, 'Should have brand_name');
    assert.ok(code.brand_slug, 'Should have brand_slug');
    assert.ok(code.source_type, 'Should have source_type');
    assert.ok(code.found_at, 'Should have found_at');
    assert.strictEqual(typeof code.confidence, 'number', 'confidence should be number');
  });
});

describe('Sort order validation', () => {
  let db;

  beforeEach(async () => {
    cleanup();
    db = initTestDb();

    // Insert codes with different dates (older first to test sorting)
    const insertCode = db.prepare(`
      INSERT INTO codes (id, code, brand_name, brand_slug, source_type, source_channel, source_video_id, found_at, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCode.run('old', 'OLD10', 'Brand', 'brand', 'youtube', 'Channel', 'v1', '2026-01-17T10:00:00Z', 0.9);
    insertCode.run('mid', 'MID20', 'Brand', 'brand', 'youtube', 'Channel', 'v2', '2026-01-18T10:00:00Z', 0.9);
    insertCode.run('new', 'NEW30', 'Brand', 'brand', 'youtube', 'Channel', 'v3', '2026-01-19T10:00:00Z', 0.9);

    db.close();

    try {
      const module = await import('../scripts/export.js');
      runExport = module.runExport;
    } catch {
      // Module not yet created
    }
  });

  afterEach(() => {
    cleanup();
  });

  test('codes are sorted by found_at descending (most recent first)', () => {
    runExport({
      dbPath: TEST_DB_PATH,
      outputPath: TEST_OUTPUT_PATH,
    });

    const json = JSON.parse(readFileSync(TEST_OUTPUT_PATH, 'utf-8'));

    assert.strictEqual(json.codes.length, 3, 'Should have 3 codes');
    assert.strictEqual(json.codes[0].id, 'new', 'First should be newest');
    assert.strictEqual(json.codes[1].id, 'mid', 'Second should be middle');
    assert.strictEqual(json.codes[2].id, 'old', 'Third should be oldest');
  });
});

describe('Empty database handling', () => {
  beforeEach(async () => {
    cleanup();
    const db = initTestDb();
    db.close();

    try {
      const module = await import('../scripts/export.js');
      runExport = module.runExport;
    } catch {
      // Module not yet created
    }
  });

  afterEach(() => {
    cleanup();
  });

  test('handles empty database gracefully', () => {
    const result = runExport({
      dbPath: TEST_DB_PATH,
      outputPath: TEST_OUTPUT_PATH,
    });

    assert.ok(result.success, 'Should succeed with empty DB');
    assert.ok(existsSync(TEST_OUTPUT_PATH), 'Output file should exist');

    const json = JSON.parse(readFileSync(TEST_OUTPUT_PATH, 'utf-8'));
    assert.deepStrictEqual(json.codes, [], 'codes should be empty array');
    assert.strictEqual(json.meta.total_codes, 0, 'total_codes should be 0');
  });
});

describe('Naming convention validation', () => {
  let db;

  beforeEach(async () => {
    cleanup();
    db = initTestDb();

    db.prepare(`
      INSERT INTO codes (id, code, brand_name, brand_slug, source_type, source_channel, source_video_id, found_at, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('code1', 'TEST', 'Brand', 'brand', 'youtube', 'Channel', 'video', '2026-01-19T10:00:00Z', 0.9);

    db.close();

    try {
      const module = await import('../scripts/export.js');
      runExport = module.runExport;
    } catch {
      // Module not yet created
    }
  });

  afterEach(() => {
    cleanup();
  });

  test('all JSON keys use snake_case', () => {
    runExport({
      dbPath: TEST_DB_PATH,
      outputPath: TEST_OUTPUT_PATH,
    });

    const json = JSON.parse(readFileSync(TEST_OUTPUT_PATH, 'utf-8'));

    // Check meta keys
    const metaKeys = Object.keys(json.meta);
    for (const key of metaKeys) {
      assert.ok(/^[a-z_]+$/.test(key), `meta.${key} should be snake_case`);
    }

    // Check code keys
    if (json.codes.length > 0) {
      const codeKeys = Object.keys(json.codes[0]);
      for (const key of codeKeys) {
        assert.ok(/^[a-z_]+$/.test(key), `code.${key} should be snake_case`);
      }
    }
  });

  test('dates use ISO 8601 format', () => {
    runExport({
      dbPath: TEST_DB_PATH,
      outputPath: TEST_OUTPUT_PATH,
    });

    const json = JSON.parse(readFileSync(TEST_OUTPUT_PATH, 'utf-8'));

    // ISO 8601 regex pattern
    const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

    assert.ok(isoPattern.test(json.meta.generated_at), 'generated_at should be ISO 8601');

    if (json.codes.length > 0) {
      assert.ok(isoPattern.test(json.codes[0].found_at), 'found_at should be ISO 8601');
    }
  });
});

describe('Export result validation', () => {
  let db;

  beforeEach(async () => {
    cleanup();
    db = initTestDb();

    db.prepare(`
      INSERT INTO codes (id, code, brand_name, brand_slug, source_type, source_channel, source_video_id, found_at, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('code1', 'TEST', 'Brand', 'brand', 'youtube', 'Channel', 'video', '2026-01-19T10:00:00Z', 0.9);

    db.prepare(`
      INSERT INTO brands (slug, name, first_seen_at, code_count)
      VALUES (?, ?, ?, ?)
    `).run('brand', 'Brand', '2026-01-19T10:00:00Z', 1);

    db.close();

    try {
      const module = await import('../scripts/export.js');
      runExport = module.runExport;
    } catch {
      // Module not yet created
    }
  });

  afterEach(() => {
    cleanup();
  });

  test('returns correct stats', () => {
    const result = runExport({
      dbPath: TEST_DB_PATH,
      outputPath: TEST_OUTPUT_PATH,
    });

    assert.ok(result.success, 'Should succeed');
    assert.strictEqual(result.totalCodes, 1, 'Should report 1 code');
    assert.strictEqual(result.totalBrands, 1, 'Should report 1 brand');
  });
});
