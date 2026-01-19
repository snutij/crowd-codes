/**
 * Database Schema Validation Tests
 * Story 2.1: Create SQLite Database Schema
 *
 * Tests validate:
 * - All tables exist with correct structure
 * - Column naming follows snake_case convention
 * - Indexes are created for performance
 * - Script is idempotent (can run multiple times)
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import Database from 'better-sqlite3';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { initializeDatabase } from '../scripts/init-db.js';

const TEST_DB_PATH = 'data/test-codes.db';

describe('Database Schema', () => {
  let db;

  before(() => {
    // Ensure data directory exists
    if (!existsSync('data')) {
      mkdirSync('data', { recursive: true });
    }

    // Clean up test database if exists
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }

    // Initialize test database using the exported function
    initializeDatabase(TEST_DB_PATH);
  });

  after(() => {
    if (db) {
      db.close();
    }
    // Clean up test database
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
  });

  test('database file exists after init', () => {
    assert.ok(
      existsSync(TEST_DB_PATH),
      `Database file should exist at ${TEST_DB_PATH}`
    );
  });

  test('codes table exists with correct columns', () => {
    db = new Database(TEST_DB_PATH);

    const tableInfo = db.prepare("PRAGMA table_info('codes')").all();
    const columnNames = tableInfo.map((col) => col.name);

    const expectedColumns = [
      'id',
      'code',
      'brand_name',
      'brand_slug',
      'source_type',
      'source_channel',
      'source_video_id',
      'found_at',
      'confidence',
    ];

    for (const col of expectedColumns) {
      assert.ok(
        columnNames.includes(col),
        `codes table should have column: ${col}`
      );
    }

    // Check id is primary key
    const idColumn = tableInfo.find((col) => col.name === 'id');
    assert.strictEqual(idColumn.pk, 1, 'id should be primary key');

    // Check code is NOT NULL
    const codeColumn = tableInfo.find((col) => col.name === 'code');
    assert.strictEqual(codeColumn.notnull, 1, 'code should be NOT NULL');
  });

  test('brands table exists with correct columns', () => {
    const tableInfo = db.prepare("PRAGMA table_info('brands')").all();
    const columnNames = tableInfo.map((col) => col.name);

    const expectedColumns = ['slug', 'name', 'first_seen_at', 'code_count'];

    for (const col of expectedColumns) {
      assert.ok(
        columnNames.includes(col),
        `brands table should have column: ${col}`
      );
    }

    // Check slug is primary key
    const slugColumn = tableInfo.find((col) => col.name === 'slug');
    assert.strictEqual(slugColumn.pk, 1, 'slug should be primary key');
  });

  test('parsing_logs table exists with correct columns', () => {
    const tableInfo = db.prepare("PRAGMA table_info('parsing_logs')").all();
    const columnNames = tableInfo.map((col) => col.name);

    const expectedColumns = [
      'id',
      'video_id',
      'description',
      'parsed_by',
      'suggested_regex',
      'created_at',
    ];

    for (const col of expectedColumns) {
      assert.ok(
        columnNames.includes(col),
        `parsing_logs table should have column: ${col}`
      );
    }

    // Check id is autoincrement primary key
    const idColumn = tableInfo.find((col) => col.name === 'id');
    assert.strictEqual(idColumn.pk, 1, 'id should be primary key');
  });

  test('all column names use snake_case convention', () => {
    const tables = ['codes', 'brands', 'parsing_logs'];
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

    for (const table of tables) {
      const tableInfo = db.prepare(`PRAGMA table_info('${table}')`).all();

      for (const col of tableInfo) {
        assert.ok(
          snakeCaseRegex.test(col.name),
          `Column ${table}.${col.name} should be snake_case`
        );
      }
    }
  });

  test('performance indexes exist', () => {
    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
      )
      .all();
    const indexNames = indexes.map((idx) => idx.name);

    const expectedIndexes = [
      'idx_codes_brand_slug',
      'idx_codes_found_at',
      'idx_parsing_logs_created_at',
    ];

    for (const idx of expectedIndexes) {
      assert.ok(indexNames.includes(idx), `Index should exist: ${idx}`);
    }
  });

  test('script is idempotent (can run multiple times)', () => {
    // Run init again - should not throw
    initializeDatabase(TEST_DB_PATH);

    // Verify tables still exist and have correct structure
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      .all();
    const tableNames = tables.map((t) => t.name);

    assert.ok(tableNames.includes('codes'), 'codes table should still exist');
    assert.ok(tableNames.includes('brands'), 'brands table should still exist');
    assert.ok(
      tableNames.includes('parsing_logs'),
      'parsing_logs table should still exist'
    );
  });

  test('confidence column has correct default value', () => {
    const tableInfo = db.prepare("PRAGMA table_info('codes')").all();
    const confidenceColumn = tableInfo.find((col) => col.name === 'confidence');

    assert.strictEqual(
      confidenceColumn.dflt_value,
      '1.0',
      'confidence should default to 1.0'
    );
  });

  test('code_count column has correct default value', () => {
    const tableInfo = db.prepare("PRAGMA table_info('brands')").all();
    const codeCountColumn = tableInfo.find((col) => col.name === 'code_count');

    assert.strictEqual(
      codeCountColumn.dflt_value,
      '0',
      'code_count should default to 0'
    );
  });

  test('initializeDatabase returns true on success', () => {
    const secondTestDb = 'data/test-codes-2.db';

    // Clean up if exists
    if (existsSync(secondTestDb)) {
      unlinkSync(secondTestDb);
    }

    const result = initializeDatabase(secondTestDb);
    assert.strictEqual(result, true, 'Should return true on success');

    // Clean up
    if (existsSync(secondTestDb)) {
      unlinkSync(secondTestDb);
    }
  });
});
