/**
 * Sitemap Generation Tests (Story 4.2)
 * Tests for sitemap.xml and robots.txt
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

describe('Sitemap Generation (Story 4.2)', () => {
  const projectRoot = process.cwd();
  const sitemapPath = join(projectRoot, '_site', 'sitemap.xml');
  const robotsPath = join(projectRoot, '_site', 'robots.txt');
  const codesPath = join(projectRoot, 'src', '_data', 'codes.json');
  let originalCodes;

  before(() => {
    // Save original codes.json
    if (existsSync(codesPath)) {
      originalCodes = readFileSync(codesPath, 'utf-8');
    }

    // Create test codes.json with test brand
    const testCodes = {
      codes: [
        {
          id: 'sitemap-test-1',
          code: 'SITEMAP50',
          brand_name: 'SitemapBrand',
          brand_slug: 'sitemapbrand',
          found_at: new Date().toISOString(),
          source_channel: 'TestChannel'
        }
      ]
    };
    writeFileSync(codesPath, JSON.stringify(testCodes, null, 2));

    // Build site with test data
    execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });

    // Restore original codes.json immediately after build
    if (originalCodes) {
      writeFileSync(codesPath, originalCodes);
    }
  });

  describe('Sitemap.xml', () => {
    test('sitemap.xml exists after build', () => {
      assert.ok(existsSync(sitemapPath), 'sitemap.xml should exist');
    });

    test('sitemap.xml is valid XML with urlset root', () => {
      const content = readFileSync(sitemapPath, 'utf-8');
      assert.match(content, /^<\?xml version="1.0"/);
      assert.match(content, /<urlset/);
      assert.match(content, /<\/urlset>/);
    });

    test('sitemap includes homepage', () => {
      const content = readFileSync(sitemapPath, 'utf-8');
      // Homepage URL should end with just / and not have any path
      assert.match(content, /<loc>https:\/\/crowd-codes\.pages\.dev\/<\/loc>/);
    });

    test('sitemap includes brand pages', () => {
      const content = readFileSync(sitemapPath, 'utf-8');
      assert.match(content, /<loc>https:\/\/[^<]+\/brands\/[^<]+\/<\/loc>/);
    });

    test('sitemap uses correct hostname', () => {
      const content = readFileSync(sitemapPath, 'utf-8');
      assert.match(content, /https:\/\/crowd-codes\.pages\.dev/);
    });
  });

  describe('Robots.txt', () => {
    test('robots.txt exists after build', () => {
      assert.ok(existsSync(robotsPath), 'robots.txt should exist');
    });

    test('robots.txt allows all user agents', () => {
      const content = readFileSync(robotsPath, 'utf-8');
      assert.match(content, /User-agent:\s*\*/);
      assert.match(content, /Allow:\s*\//);
    });

    test('robots.txt references sitemap with correct URL', () => {
      const content = readFileSync(robotsPath, 'utf-8');
      assert.match(content, /Sitemap:\s*https:\/\/[^\s]+\/sitemap\.xml/i);
    });

    test('robots.txt uses correct hostname', () => {
      const content = readFileSync(robotsPath, 'utf-8');
      assert.match(content, /https:\/\/crowd-codes\.pages\.dev\/sitemap\.xml/);
    });
  });
});
