/**
 * Brand Page SEO Tests (Story 4.1)
 * Tests for SEO meta tags on brand pages
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

describe('Brand Page SEO (Story 4.1)', () => {
  const projectRoot = process.cwd();
  const testBrandSlug = 'testbrand-seo';
  const testBrandName = 'TestBrandSEO';
  const codesPath = join(projectRoot, 'src', '_data', 'codes.json');
  let originalCodes;
  let brandPagePath;

  before(() => {
    // Save original codes.json
    if (existsSync(codesPath)) {
      originalCodes = readFileSync(codesPath, 'utf-8');
    }

    // Create test codes.json with test brand
    const testCodes = {
      codes: [
        {
          id: 'test-seo-1',
          code: 'TESTSEO50',
          brand_name: testBrandName,
          brand_slug: testBrandSlug,
          found_at: new Date().toISOString(),
          source_channel: 'TestChannel'
        },
        {
          id: 'test-seo-2',
          code: 'TESTSEO25',
          brand_name: testBrandName,
          brand_slug: testBrandSlug,
          found_at: new Date(Date.now() - 86400000).toISOString(),
          source_channel: 'TestChannel'
        }
      ]
    };
    writeFileSync(codesPath, JSON.stringify(testCodes, null, 2));

    // Build site with test data
    execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });

    brandPagePath = join(projectRoot, '_site', 'brands', testBrandSlug, 'index.html');

    // Restore original codes.json immediately after build
    if (originalCodes) {
      writeFileSync(codesPath, originalCodes);
    }
  });

  describe('Title Tag', () => {
    test('brand page has SEO-optimized title with brand name', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<title>Code promo TestBrandSEO/);
    });

    test('brand page title includes "Crowd Codes"', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<title>[^<]*Crowd Codes<\/title>/);
    });
  });

  describe('Meta Description', () => {
    test('brand page has meta description', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<meta name="description" content="[^"]+"/);
    });

    test('meta description includes code count', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const descMatch = content.match(/<meta name="description" content="([^"]+)"/);
      assert.ok(descMatch, 'Meta description should exist');
      assert.match(descMatch[1], /2 codes promo/);
    });

    test('meta description includes brand name', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const descMatch = content.match(/<meta name="description" content="([^"]+)"/);
      assert.ok(descMatch, 'Meta description should exist');
      assert.match(descMatch[1], /TestBrandSEO/);
    });

    test('meta description has reasonable length (50-200 chars)', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const descMatch = content.match(/<meta name="description" content="([^"]+)"/);
      assert.ok(descMatch, 'Meta description should exist');
      const descLength = descMatch[1].length;
      assert.ok(descLength >= 50 && descLength <= 200, `Description length ${descLength} should be between 50-200 chars`);
    });
  });

  describe('Canonical URL', () => {
    test('brand page has canonical URL', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<link rel="canonical" href="https:\/\//);
    });

    test('canonical URL includes brand slug', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const canonicalMatch = content.match(/<link rel="canonical" href="([^"]+)"/);
      assert.ok(canonicalMatch, 'Canonical link should exist');
      assert.match(canonicalMatch[1], new RegExp(`/brands/${testBrandSlug}/`));
    });
  });

  describe('Open Graph Tags', () => {
    test('brand page has og:title', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<meta property="og:title" content="[^"]+"/);
    });

    test('brand page has og:description', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<meta property="og:description" content="[^"]+"/);
    });

    test('brand page has og:type="website"', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<meta property="og:type" content="website"/);
    });

    test('brand page has og:url', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<meta property="og:url" content="https:\/\//);
    });

    test('brand page has og:site_name', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<meta property="og:site_name" content="Crowd Codes"/);
    });

    test('brand page has og:locale="fr_FR"', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<meta property="og:locale" content="fr_FR"/);
    });

    test('og:url matches canonical URL', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const canonicalMatch = content.match(/<link rel="canonical" href="([^"]+)"/);
      const ogUrlMatch = content.match(/<meta property="og:url" content="([^"]+)"/);
      assert.ok(canonicalMatch && ogUrlMatch, 'Both canonical and og:url should exist');
      assert.strictEqual(canonicalMatch[1], ogUrlMatch[1], 'Canonical and og:url should match');
    });
  });

  describe('Twitter Card Tags', () => {
    test('brand page has twitter:card="summary"', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<meta name="twitter:card" content="summary"/);
    });

    test('brand page has twitter:title', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<meta name="twitter:title" content="[^"]+"/);
    });

    test('brand page has twitter:description', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<meta name="twitter:description" content="[^"]+"/);
    });
  });
});

describe('Homepage SEO (Story 4.1)', () => {
  const projectRoot = process.cwd();
  const homepagePath = join(projectRoot, '_site', 'index.html');

  test('homepage has canonical URL', () => {
    const content = readFileSync(homepagePath, 'utf-8');
    assert.match(content, /<link rel="canonical" href="https:\/\/[^"]+\/"/);
  });

  test('homepage has og:url', () => {
    const content = readFileSync(homepagePath, 'utf-8');
    assert.match(content, /<meta property="og:url" content="https:\/\//);
  });

  test('homepage has og:site_name', () => {
    const content = readFileSync(homepagePath, 'utf-8');
    assert.match(content, /<meta property="og:site_name" content="Crowd Codes"/);
  });

  test('homepage has twitter:card', () => {
    const content = readFileSync(homepagePath, 'utf-8');
    assert.match(content, /<meta name="twitter:card" content="summary"/);
  });
});
