/**
 * JSON-LD Schema Markup Tests (Story 4.3)
 * Tests for structured data on brand pages and homepage
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

describe('JSON-LD Schema Markup (Story 4.3)', () => {
  const projectRoot = process.cwd();
  const testBrandSlug = 'jsonld-testbrand';
  const testBrandName = 'JsonLdTestBrand';
  const codesPath = join(projectRoot, 'src', '_data', 'codes.json');
  let originalCodes;
  let brandPagePath;
  let homepagePath;

  before(() => {
    // Save original codes.json
    if (existsSync(codesPath)) {
      originalCodes = readFileSync(codesPath, 'utf-8');
    }

    // Create test codes.json with test brand
    const testCodes = {
      codes: [
        {
          id: 'jsonld-test-1',
          code: 'JSONLD50',
          brand_name: testBrandName,
          brand_slug: testBrandSlug,
          found_at: new Date().toISOString(),
          source_channel: 'TestChannel'
        },
        {
          id: 'jsonld-test-2',
          code: 'JSONLD25',
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
    homepagePath = join(projectRoot, '_site', 'index.html');

    // Restore original codes.json immediately after build
    if (originalCodes) {
      writeFileSync(codesPath, originalCodes);
    }
  });

  describe('Brand Page JSON-LD', () => {
    test('brand page has JSON-LD script tag', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<script type="application\/ld\+json">/);
    });

    test('brand page JSON-LD is valid JSON', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      assert.ok(jsonLdMatch, 'JSON-LD script should exist');
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      assert.ok(jsonLd, 'JSON-LD should be valid JSON');
    });

    test('brand page JSON-LD has ItemList type', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      assert.strictEqual(jsonLd['@type'], 'ItemList');
    });

    test('brand page JSON-LD has correct context', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      assert.strictEqual(jsonLd['@context'], 'https://schema.org');
    });

    test('brand page JSON-LD includes brand name', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      assert.ok(jsonLd.name.includes(testBrandName), `Name should include ${testBrandName}`);
    });

    test('brand page JSON-LD has correct numberOfItems', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      assert.strictEqual(jsonLd.numberOfItems, 2);
    });

    test('brand page JSON-LD has itemListElement array', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      assert.ok(Array.isArray(jsonLd.itemListElement), 'itemListElement should be an array');
      assert.strictEqual(jsonLd.itemListElement.length, 2);
    });

    test('brand page JSON-LD ListItems have correct structure', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      const firstItem = jsonLd.itemListElement[0];
      assert.strictEqual(firstItem['@type'], 'ListItem');
      assert.strictEqual(firstItem.position, 1);
      assert.ok(firstItem.name, 'ListItem should have a name');
    });

    test('brand page JSON-LD has URL', () => {
      const content = readFileSync(brandPagePath, 'utf-8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      assert.ok(jsonLd.url, 'Should have URL');
      assert.match(jsonLd.url, new RegExp(`/brands/${testBrandSlug}/`));
    });
  });

  describe('Homepage JSON-LD', () => {
    test('homepage has JSON-LD script tag', () => {
      const content = readFileSync(homepagePath, 'utf-8');
      assert.match(content, /<script type="application\/ld\+json">/);
    });

    test('homepage has WebSite schema', () => {
      const content = readFileSync(homepagePath, 'utf-8');
      const jsonLdMatches = content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
      let hasWebSite = false;
      for (const match of jsonLdMatches) {
        const jsonLd = JSON.parse(match[1]);
        if (jsonLd['@type'] === 'WebSite') {
          hasWebSite = true;
          break;
        }
      }
      assert.ok(hasWebSite, 'Homepage should have WebSite schema');
    });

    test('homepage WebSite has SearchAction', () => {
      const content = readFileSync(homepagePath, 'utf-8');
      const jsonLdMatches = content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
      let webSiteSchema = null;
      for (const match of jsonLdMatches) {
        const jsonLd = JSON.parse(match[1]);
        if (jsonLd['@type'] === 'WebSite') {
          webSiteSchema = jsonLd;
          break;
        }
      }
      assert.ok(webSiteSchema, 'WebSite schema should exist');
      assert.ok(webSiteSchema.potentialAction, 'Should have potentialAction');
      assert.strictEqual(webSiteSchema.potentialAction['@type'], 'SearchAction');
    });

    test('homepage SearchAction has correct target structure', () => {
      const content = readFileSync(homepagePath, 'utf-8');
      const jsonLdMatches = content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
      let webSiteSchema = null;
      for (const match of jsonLdMatches) {
        const jsonLd = JSON.parse(match[1]);
        if (jsonLd['@type'] === 'WebSite') {
          webSiteSchema = jsonLd;
          break;
        }
      }
      const searchAction = webSiteSchema.potentialAction;
      assert.ok(searchAction.target, 'SearchAction should have target');
      assert.strictEqual(searchAction.target['@type'], 'EntryPoint');
      assert.match(searchAction.target.urlTemplate, /\?q=\{search_term_string\}/);
    });

    test('homepage has query-input specification', () => {
      const content = readFileSync(homepagePath, 'utf-8');
      const jsonLdMatches = content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
      let webSiteSchema = null;
      for (const match of jsonLdMatches) {
        const jsonLd = JSON.parse(match[1]);
        if (jsonLd['@type'] === 'WebSite') {
          webSiteSchema = jsonLd;
          break;
        }
      }
      const searchAction = webSiteSchema.potentialAction;
      assert.ok(searchAction['query-input'], 'SearchAction should have query-input');
      assert.match(searchAction['query-input'], /search_term_string/);
    });

    test('homepage has Organization schema', () => {
      const content = readFileSync(homepagePath, 'utf-8');
      const jsonLdMatches = content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
      let hasOrganization = false;
      for (const match of jsonLdMatches) {
        const jsonLd = JSON.parse(match[1]);
        if (jsonLd['@type'] === 'Organization') {
          hasOrganization = true;
          assert.strictEqual(jsonLd.name, 'Crowd Codes');
          break;
        }
      }
      assert.ok(hasOrganization, 'Homepage should have Organization schema');
    });
  });
});
