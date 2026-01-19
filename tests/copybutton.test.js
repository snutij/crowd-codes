import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Tests for Story 3.4: Implement CopyButton with Clipboard API
 *
 * Tests verify:
 * - copy.js module exists and exports copyToClipboard function
 * - Button state changes on click (text, class, aria-label)
 * - CSS copied state styles
 * - Keyboard accessibility
 * - Event delegation pattern
 */

describe('CopyButton Module (Story 3.4)', () => {
  const projectRoot = process.cwd();
  const copyJsPath = join(projectRoot, 'public', 'js', 'copy.js');
  let copyJsContent;

  before(() => {
    // Build the site before running tests
    execSync('npm run build', { stdio: 'inherit' });

    // Read file contents
    if (existsSync(copyJsPath)) {
      copyJsContent = readFileSync(copyJsPath, 'utf-8');
    }
  });

  describe('AC#1: copy.js module exists with Clipboard API', () => {
    test('copy.js file exists in public/js/', () => {
      assert.ok(existsSync(copyJsPath),
        'public/js/copy.js should exist');
    });

    test('copy.js exports copyToClipboard function', () => {
      assert.match(copyJsContent, /export\s+.*copyToClipboard/,
        'Should export copyToClipboard function');
    });

    test('copyToClipboard uses navigator.clipboard.writeText', () => {
      assert.match(copyJsContent, /navigator\.clipboard\.writeText/,
        'Should use modern Clipboard API');
    });

    test('copyToClipboard has fallback for older browsers', () => {
      assert.match(copyJsContent, /document\.execCommand\s*\(\s*['"]copy['"]\s*\)/,
        'Should have fallback using execCommand');
    });

    test('copyToClipboard is async function', () => {
      assert.match(copyJsContent, /async\s+function\s+copyToClipboard/,
        'copyToClipboard should be async');
    });

    test('copyToClipboard returns boolean', () => {
      assert.match(copyJsContent, /return\s+true/,
        'Should return true on success');
      assert.match(copyJsContent, /return\s+(false|success)/,
        'Should return boolean on fallback');
    });
  });

  describe('AC#2: Button state feedback', () => {
    test('copy.js handles button text change to "Copié ✓"', () => {
      assert.match(copyJsContent, /Copié\s*✓/,
        'Should change button text to "Copié ✓"');
    });

    test('copy.js adds .copy-btn--copied class on success', () => {
      assert.match(copyJsContent, /copy-btn--copied/,
        'Should add .copy-btn--copied class');
    });

    test('copy.js resets button after 2 seconds', () => {
      assert.match(copyJsContent, /setTimeout/,
        'Should use setTimeout for reset');
      assert.match(copyJsContent, /2000/,
        'Should use 2000ms (2 seconds) delay');
    });

    test('copy.js resets button text to original', () => {
      assert.match(copyJsContent, /btn\.textContent\s*=\s*originalText/,
        'Should reset text to originalText');
    });

    test('copy.js uses event delegation on results container', () => {
      assert.match(copyJsContent, /getElementById\s*\(\s*['"]results['"]\s*\)/,
        'Should target results container');
      assert.match(copyJsContent, /addEventListener\s*\(\s*['"]click['"]/,
        'Should add click event listener');
    });

    test('copy.js gets code from data-code-value attribute', () => {
      assert.match(copyJsContent, /dataset\.codeValue|data-code-value/,
        'Should read code from data-code-value attribute');
    });

    test('copy.js prevents double-clicks during copied state', () => {
      assert.match(copyJsContent, /copy-btn--copied/,
        'Should check for .copy-btn--copied class to prevent double-click');
    });

    test('copy.js handles copy failure with error state', () => {
      assert.match(copyJsContent, /copy-btn--error/,
        'Should add .copy-btn--error class on failure');
      assert.match(copyJsContent, /Erreur/,
        'Should show error message on failure');
    });

    test('copy.js uses original button text for reset', () => {
      assert.match(copyJsContent, /originalText/,
        'Should store and use originalText for reset');
    });
  });

  describe('AC#3: CSS copied state (44px touch target)', () => {
    const componentsPath = join(projectRoot, 'public', 'css', 'components.css');
    let componentsCssContent;

    before(() => {
      if (existsSync(componentsPath)) {
        componentsCssContent = readFileSync(componentsPath, 'utf-8');
      }
    });

    test('.copy-btn--copied class exists in CSS', () => {
      assert.match(componentsCssContent, /\.copy-btn--copied\s*\{/,
        'Should have .copy-btn--copied class');
    });

    test('.copy-btn--copied uses success color', () => {
      assert.match(componentsCssContent, /\.copy-btn--copied\s*\{[^}]*background:\s*var\(--color-success\)/,
        'Should use --color-success for background');
    });

    test('.copy-btn--copied prevents pointer events', () => {
      assert.match(componentsCssContent, /\.copy-btn--copied\s*\{[^}]*pointer-events:\s*none/,
        'Should disable pointer-events to prevent double-click');
    });

    test('.copy-btn--copied:focus has visible outline', () => {
      assert.match(componentsCssContent, /\.copy-btn--copied:focus\s*\{[^}]*outline/,
        'Should maintain visible focus outline');
    });

    test('.copy-btn--error class exists for failure state', () => {
      assert.match(componentsCssContent, /\.copy-btn--error\s*\{/,
        'Should have .copy-btn--error class for copy failures');
    });

    test('.copy-btn has background-color transition', () => {
      assert.match(componentsCssContent, /\.copy-btn\s*\{[^}]*transition:[^}]*background-color/,
        'copy-btn should transition background-color for smooth state changes');
    });

    test('copy button maintains 44px touch target', () => {
      assert.match(componentsCssContent, /\.copy-btn\s*\{[^}]*min-height:\s*var\(--touch-min\)/,
        'copy-btn should have min-height: var(--touch-min)');
    });
  });

  describe('AC#4: Keyboard accessibility', () => {
    test('copy.js updates aria-label during copied state', () => {
      assert.match(copyJsContent, /aria-label/,
        'Should update aria-label');
      assert.match(copyJsContent, /Code copié|copié/i,
        'Should indicate code was copied');
    });

    test('button has type="button" (from Story 3.3)', () => {
      const searchJsPath = join(projectRoot, 'public', 'js', 'search.js');
      const searchJsContent = readFileSync(searchJsPath, 'utf-8');
      assert.match(searchJsContent, /type="button"/,
        'Button should have type="button" for keyboard accessibility');
    });
  });
});

describe('CopyButton Integration (Story 3.4)', () => {
  const projectRoot = process.cwd();

  describe('Build Integration', () => {
    test('built site includes copy.js', () => {
      const builtCopyJs = join(projectRoot, '_site', 'js', 'copy.js');
      assert.ok(existsSync(builtCopyJs),
        'copy.js should be copied to _site/js/');
    });

    test('built components.css includes copied state', () => {
      const builtCss = join(projectRoot, '_site', 'css', 'components.css');
      const content = readFileSync(builtCss, 'utf-8');
      assert.match(content, /\.copy-btn--copied/,
        'Built components.css should include .copy-btn--copied');
    });

    test('built index.html includes copy.js script tag', () => {
      const builtHtml = join(projectRoot, '_site', 'index.html');
      const content = readFileSync(builtHtml, 'utf-8');
      assert.match(content, /<script[^>]*src=["']\/js\/copy\.js["']/,
        'Built index.html should include copy.js script tag');
    });
  });

  describe('Module Integration', () => {
    test('copy.js uses JSON logging format', () => {
      const copyJsPath = join(projectRoot, 'public', 'js', 'copy.js');
      const content = readFileSync(copyJsPath, 'utf-8');
      assert.match(content, /JSON\.stringify/,
        'Should use JSON.stringify for structured logging');
    });

    test('copy.js initializes on DOMContentLoaded or immediately', () => {
      const copyJsPath = join(projectRoot, 'public', 'js', 'copy.js');
      const content = readFileSync(copyJsPath, 'utf-8');
      assert.match(content, /DOMContentLoaded|document\.readyState/,
        'Should handle DOM ready state');
    });
  });
});

describe('CopyButton CSS Transition (Story 3.4)', () => {
  const projectRoot = process.cwd();
  const componentsPath = join(projectRoot, 'public', 'css', 'components.css');
  let componentsCssContent;

  before(() => {
    if (existsSync(componentsPath)) {
      componentsCssContent = readFileSync(componentsPath, 'utf-8');
    }
  });

  test('.copy-btn has smooth transition', () => {
    assert.match(componentsCssContent, /\.copy-btn\s*\{[^}]*transition/,
      'copy-btn should have transition property');
  });
});
