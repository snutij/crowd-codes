import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

// Test the homepage HTML structure after Eleventy build
describe('Homepage (Story 3.1)', () => {
  const sitePath = join(process.cwd(), '_site', 'index.html');
  let html;

  before(() => {
    // Build the site before running tests
    execSync('npm run build', { stdio: 'inherit' });

    // Read the generated HTML
    if (!existsSync(sitePath)) {
      throw new Error(`Build output not found at ${sitePath}`);
    }
    html = readFileSync(sitePath, 'utf-8');
  });

  describe('AC#1: Search input with autofocus', () => {
    test('search input exists with autofocus attribute', () => {
      // Check for input with autofocus
      assert.match(html, /<input[^>]*autofocus[^>]*>/i,
        'Search input should have autofocus attribute');
    });

    test('search input has type="search"', () => {
      assert.match(html, /<input[^>]*type=["']search["'][^>]*>/i,
        'Search input should have type="search"');
    });

    test('search input has id="search"', () => {
      assert.match(html, /<input[^>]*id=["']search["'][^>]*>/i,
        'Search input should have id="search" for JavaScript binding');
    });
  });

  describe('AC#2: Semantic markup with aria-label', () => {
    test('search element wraps input (HTML5 semantic)', () => {
      assert.match(html, /<search[^>]*>[\s\S]*<input[\s\S]*<\/search>/i,
        'Search input should be wrapped in <search> element');
    });

    test('search input has aria-label', () => {
      assert.match(html, /<input[^>]*aria-label=["'][^"']+["'][^>]*>/i,
        'Search input should have aria-label for accessibility');
    });

    test('placeholder text is present', () => {
      assert.match(html, /<input[^>]*placeholder=["'][^"']+["'][^>]*>/i,
        'Search input should have placeholder text');
    });
  });

  describe('AC#3: Styling (CSS verification deferred to browser)', () => {
    test('search input has search-input class', () => {
      assert.match(html, /<input[^>]*class=["'][^"']*search-input[^"']*["'][^>]*>/i,
        'Search input should have search-input class for styling');
    });
  });

  describe('AC#4: No ads, popups, or unnecessary elements', () => {
    test('no iframe elements (potential ads)', () => {
      assert.doesNotMatch(html, /<iframe/i,
        'Page should not contain iframes');
    });

    test('no external ad scripts', () => {
      // Check for common ad network scripts
      assert.doesNotMatch(html, /googlesyndication|doubleclick|adsbygoogle/i,
        'Page should not contain ad scripts');
    });

    test('results container exists for future content', () => {
      assert.match(html, /<section[^>]*id=["']results["'][^>]*>/i,
        'Results container section should exist');
    });

    test('results container has aria-label', () => {
      assert.match(html, /<section[^>]*id=["']results["'][^>]*aria-label=["'][^"']+["'][^>]*>/i,
        'Results container should have aria-label');
    });
  });
});
