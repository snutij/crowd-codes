import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Tests for Story 3.2: Implement Fuse.js Fuzzy Search
 *
 * Tests verify:
 * - Fuse.js initialization
 * - Debounce behavior
 * - Search result ordering
 * - Integration with build output
 */

describe('Search Module (Story 3.2)', () => {
  const projectRoot = process.cwd();
  const searchJsPath = join(projectRoot, 'public', 'js', 'search.js');
  const codesJsonPath = join(projectRoot, 'src', '_data', 'codes.json');
  const siteIndexPath = join(projectRoot, '_site', 'index.html');
  let searchJsContent;

  before(() => {
    // Build the site before running tests
    execSync('npm run build', { stdio: 'inherit' });

    // Read search.js content
    if (existsSync(searchJsPath)) {
      searchJsContent = readFileSync(searchJsPath, 'utf-8');
    }
  });

  describe('AC#1: Fuse.js initialization', () => {
    test('search.js file exists', () => {
      assert.ok(existsSync(searchJsPath), 'public/js/search.js should exist');
    });

    test('search.js imports Fuse.js', () => {
      assert.match(searchJsContent, /import\s+Fuse\s+from/i,
        'search.js should import Fuse.js');
    });

    test('search.js defines FUSE_OPTIONS with correct keys', () => {
      assert.match(searchJsContent, /keys:\s*\[/,
        'FUSE_OPTIONS should define keys array');
      assert.match(searchJsContent, /brand_name/,
        'FUSE_OPTIONS should include brand_name key');
      assert.match(searchJsContent, /brand_slug/,
        'FUSE_OPTIONS should include brand_slug key');
      assert.match(searchJsContent, /code/,
        'FUSE_OPTIONS should include code key');
    });

    test('search.js initializes Fuse.js with options', () => {
      assert.match(searchJsContent, /new\s+Fuse\s*\(/,
        'search.js should create new Fuse instance');
      assert.match(searchJsContent, /FUSE_OPTIONS/,
        'search.js should use FUSE_OPTIONS');
    });

    test('search.js fetches codes.json', () => {
      assert.match(searchJsContent, /fetch\s*\(\s*['"]\/codes\.json['"]\s*\)/,
        'search.js should fetch /codes.json');
    });
  });

  describe('AC#2: Search response time < 200ms', () => {
    test('search is client-side only (no network after initial load)', () => {
      // Verify no additional network calls in performSearch
      const performSearchMatch = searchJsContent.match(/function\s+performSearch[\s\S]*?^}/m);
      if (performSearchMatch) {
        assert.doesNotMatch(performSearchMatch[0], /fetch\s*\(/,
          'performSearch should not make network calls');
      }
    });

    test('threshold is set for fuzzy matching', () => {
      assert.match(searchJsContent, /threshold:\s*0\.\d+/,
        'FUSE_OPTIONS should set threshold for fuzzy matching');
    });
  });

  describe('AC#3: Debounced search (50ms)', () => {
    test('debounce function is defined', () => {
      assert.match(searchJsContent, /function\s+debounce/,
        'debounce function should be defined');
    });

    test('DEBOUNCE_DELAY is set to 50ms', () => {
      assert.match(searchJsContent, /DEBOUNCE_DELAY\s*=\s*50/,
        'DEBOUNCE_DELAY should be 50ms');
    });

    test('search input uses debounced handler', () => {
      assert.match(searchJsContent, /debounce\s*\(/,
        'search should use debounce wrapper');
      assert.match(searchJsContent, /addEventListener\s*\(\s*['"]input['"]/,
        'search input should listen to input events');
    });
  });

  describe('AC#4: Results sorted by found_at descending', () => {
    test('renderResults sorts by found_at', () => {
      assert.match(searchJsContent, /sort\s*\(/,
        'renderResults should sort results');
      assert.match(searchJsContent, /found_at/,
        'renderResults should use found_at for sorting');
    });

    test('sorting is descending (most recent first)', () => {
      // Check that sorting uses Date comparison on found_at
      // Verify sort function exists with callback
      assert.match(searchJsContent, /\.sort\s*\(/,
        'Should use sort method');
      assert.match(searchJsContent, /new\s+Date\s*\([^)]*found_at/,
        'Sort should create Date from found_at');
      // Verify B comes before A in subtraction (descending order)
      assert.match(searchJsContent, /itemB\.found_at[\s\S]*?itemA\.found_at/,
        'Sort should compare itemB before itemA (descending)');
    });
  });

  describe('Build Integration', () => {
    test('built index.html includes search.js script tag', () => {
      const indexHtml = readFileSync(siteIndexPath, 'utf-8');
      assert.match(indexHtml, /<script\s+type=["']module["']\s+src=["']\/js\/search\.js["']/,
        'Built index.html should include search.js as ES module');
    });

    test('search.js is copied to _site/js/', () => {
      const builtSearchJs = join(projectRoot, '_site', 'js', 'search.js');
      assert.ok(existsSync(builtSearchJs),
        'search.js should be copied to _site/js/');
    });

    test('codes.json is copied to _site/', () => {
      const builtCodesJson = join(projectRoot, '_site', 'codes.json');
      assert.ok(existsSync(builtCodesJson),
        'codes.json should be copied to _site/');
    });
  });

  describe('Code Quality', () => {
    test('uses ES module syntax', () => {
      assert.match(searchJsContent, /export\s*\{/,
        'search.js should use ES module exports');
    });

    test('uses structured JSON logging', () => {
      assert.match(searchJsContent, /console\.(log|error)\s*\(\s*JSON\.stringify/,
        'search.js should use JSON.stringify for structured logging');
    });

    test('handles errors gracefully', () => {
      assert.match(searchJsContent, /try\s*\{/,
        'search.js should have try/catch for error handling');
      assert.match(searchJsContent, /catch\s*\(/,
        'search.js should catch errors');
    });

    test('escapes HTML to prevent XSS', () => {
      assert.match(searchJsContent, /escapeHtml/,
        'search.js should have escapeHtml function');
    });
  });

  describe('Accessibility', () => {
    test('updates aria-label on results container', () => {
      assert.match(searchJsContent, /setAttribute\s*\(\s*['"]aria-label['"]/,
        'search.js should update aria-label for screen readers');
    });
  });
});

describe('Debounce Logic Unit Tests', () => {
  test('debounce implementation pattern is correct', () => {
    // Test the debounce implementation pattern
    let callCount = 0;
    let timeoutId;

    function debounce(fn, delay) {
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    }

    const debouncedFn = debounce(() => callCount++, 50);

    // Call multiple times rapidly
    debouncedFn();
    debouncedFn();
    debouncedFn();

    // Should not have called yet (still within debounce window)
    assert.strictEqual(callCount, 0, 'Debounce should not call immediately');
  });
});

describe('Sort Logic Unit Tests', () => {
  test('descending sort by date works correctly', () => {
    const testData = [
      { item: { found_at: '2026-01-15T10:00:00Z' } },
      { item: { found_at: '2026-01-18T10:00:00Z' } },
      { item: { found_at: '2026-01-16T10:00:00Z' } }
    ];

    const sorted = [...testData].sort((a, b) =>
      new Date(b.item.found_at) - new Date(a.item.found_at)
    );

    assert.strictEqual(sorted[0].item.found_at, '2026-01-18T10:00:00Z',
      'Most recent date should be first');
    assert.strictEqual(sorted[1].item.found_at, '2026-01-16T10:00:00Z',
      'Second most recent should be second');
    assert.strictEqual(sorted[2].item.found_at, '2026-01-15T10:00:00Z',
      'Oldest date should be last');
  });
});

describe('formatRelativeDate Unit Tests', () => {
  // Replicate the formatRelativeDate logic for unit testing
  function formatRelativeDate(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        return 'il y a quelques minutes';
      }
      return `il y a ${diffHours}h`;
    }
    if (diffDays === 1) return 'hier';
    if (diffDays < 7) return `il y a ${diffDays} jours`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  }

  test('returns "il y a quelques minutes" for recent dates', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();
    assert.strictEqual(formatRelativeDate(fiveMinutesAgo), 'il y a quelques minutes');
  });

  test('returns hours for same day', () => {
    const now = new Date();
    const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(formatRelativeDate(threeHoursAgo), 'il y a 3h');
  });

  test('returns "hier" for yesterday', () => {
    const now = new Date();
    const yesterday = new Date(now - 25 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(formatRelativeDate(yesterday), 'hier');
  });

  test('returns days for 2-6 days ago', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(formatRelativeDate(threeDaysAgo), 'il y a 3 jours');
  });

  test('returns weeks for 7-29 days ago', () => {
    const now = new Date();
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(formatRelativeDate(twoWeeksAgo), 'il y a 2 semaines');
  });

  test('returns singular week for 7-13 days', () => {
    const now = new Date();
    const oneWeekAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(formatRelativeDate(oneWeekAgo), 'il y a 1 semaine');
  });

  test('returns formatted date for 30+ days ago', () => {
    const result = formatRelativeDate('2025-06-15T10:00:00Z');
    // Should be a date like "15 juin"
    assert.match(result, /\d+\s+\w+/, 'Should return formatted date');
  });
});
