import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Tests for Story 3.3: Create CodeCard Component
 *
 * Tests verify:
 * - CodeCard HTML structure matches specification
 * - Mobile layout (code + button same row)
 * - French relative date display
 * - Accessibility attributes present
 * - CSS styling for touch targets
 */

describe('CodeCard Component (Story 3.3)', () => {
  const projectRoot = process.cwd();
  const searchJsPath = join(projectRoot, 'public', 'js', 'search.js');
  const componentsPath = join(projectRoot, 'public', 'css', 'components.css');
  const codeCardNjkPath = join(projectRoot, 'src', '_includes', 'code-card.njk');
  const eleventyConfigPath = join(projectRoot, '.eleventy.js');
  let searchJsContent;
  let componentsCssContent;
  let codeCardNjkContent;
  let eleventyConfigContent;

  before(() => {
    // Build the site before running tests
    execSync('npm run build', { stdio: 'inherit' });

    // Read file contents
    if (existsSync(searchJsPath)) {
      searchJsContent = readFileSync(searchJsPath, 'utf-8');
    }
    if (existsSync(componentsPath)) {
      componentsCssContent = readFileSync(componentsPath, 'utf-8');
    }
    if (existsSync(codeCardNjkPath)) {
      codeCardNjkContent = readFileSync(codeCardNjkPath, 'utf-8');
    }
    if (existsSync(eleventyConfigPath)) {
      eleventyConfigContent = readFileSync(eleventyConfigPath, 'utf-8');
    }
  });

  describe('AC#1: CodeCard displays code, brand, date, source', () => {
    test('search.js generates article element with code-card class', () => {
      assert.match(searchJsContent, /<article class="code-card"/,
        'Should generate article element with code-card class');
    });

    test('search.js generates code element with code-value class', () => {
      assert.match(searchJsContent, /<code class="code-value">/,
        'Should generate code element for promo code');
    });

    test('search.js includes brand name in metadata', () => {
      assert.match(searchJsContent, /class="code-brand"/,
        'Should include code-brand span');
    });

    test('search.js includes relative date in metadata', () => {
      assert.match(searchJsContent, /class="code-date"/,
        'Should include code-date span');
    });

    test('search.js includes source channel when available', () => {
      assert.match(searchJsContent, /class="code-source"/,
        'Should include code-source span when source_channel exists');
    });

    test('search.js adds data-code-id attribute', () => {
      assert.match(searchJsContent, /data-code-id="/,
        'Should include data-code-id attribute');
    });

    test('search.js adds data-code-value attribute', () => {
      assert.match(searchJsContent, /data-code-value="/,
        'Should include data-code-value attribute');
    });
  });

  describe('AC#2: Mobile layout - code and button same row', () => {
    test('CSS uses flexbox for code-card-main', () => {
      assert.match(componentsCssContent, /\.code-card-main\s*\{[^}]*display:\s*flex/,
        'code-card-main should use display: flex');
    });

    test('CSS uses justify-content space-between for main row', () => {
      assert.match(componentsCssContent, /\.code-card-main\s*\{[^}]*justify-content:\s*space-between/,
        'code-card-main should use justify-content: space-between');
    });

    test('CSS aligns items center in main row', () => {
      assert.match(componentsCssContent, /\.code-card-main\s*\{[^}]*align-items:\s*center/,
        'code-card-main should use align-items: center');
    });

    test('copy button has minimum touch target of 44px', () => {
      assert.match(componentsCssContent, /\.copy-btn\s*\{[^}]*min-height:\s*var\(--touch-min\)/,
        'copy-btn should have min-height: var(--touch-min)');
    });

    test('search.js generates copy button on same row as code', () => {
      // Verify button is inside code-card-main div
      assert.match(searchJsContent, /<div class="code-card-main">[^]*<code class="code-value">[^]*<button class="copy-btn"/,
        'Button should be in code-card-main div alongside code');
    });
  });

  describe('AC#3: French relative date display', () => {
    test('search.js uses formatRelativeDate function', () => {
      assert.match(searchJsContent, /formatRelativeDate\(item\.found_at\)/,
        'Should call formatRelativeDate with found_at');
    });

    test('Eleventy config has formatRelativeDate filter', () => {
      assert.match(eleventyConfigContent, /addFilter\s*\(\s*["']formatRelativeDate["']/,
        'Eleventy config should define formatRelativeDate filter');
    });

    test('formatRelativeDate filter returns French strings', () => {
      assert.match(eleventyConfigContent, /il y a/,
        'formatRelativeDate should return French relative strings');
      assert.match(eleventyConfigContent, /hier/,
        'formatRelativeDate should handle yesterday');
      assert.match(eleventyConfigContent, /jours/,
        'formatRelativeDate should handle days');
      assert.match(eleventyConfigContent, /semaine/,
        'formatRelativeDate should handle weeks');
    });
  });

  describe('AC#4: Uses new component structure', () => {
    test('code-card.njk template exists', () => {
      assert.ok(existsSync(codeCardNjkPath),
        'src/_includes/code-card.njk should exist');
    });

    test('code-card.njk has article element', () => {
      assert.match(codeCardNjkContent, /<article class="code-card"/,
        'Template should use article element');
    });

    test('code-card.njk has code element', () => {
      assert.match(codeCardNjkContent, /<code class="code-value">/,
        'Template should use code element');
    });

    test('code-card.njk has copy button', () => {
      assert.match(codeCardNjkContent, /<button class="copy-btn"/,
        'Template should include copy button');
    });

    test('code-card.njk uses formatRelativeDate filter', () => {
      assert.match(codeCardNjkContent, /\|\s*formatRelativeDate/,
        'Template should use formatRelativeDate filter');
    });
  });

  describe('Accessibility Compliance', () => {
    test('copy button has aria-label with code', () => {
      assert.match(searchJsContent, /aria-label="Copier le code/,
        'Copy button should have aria-label for screen readers');
    });

    test('code-card.njk has aria-label on button', () => {
      assert.match(codeCardNjkContent, /aria-label="Copier le code/,
        'Template button should have aria-label');
    });

    test('button has type="button" attribute', () => {
      assert.match(searchJsContent, /type="button"/,
        'Button should have type="button" to prevent form submission');
    });

    test('results container has aria-label', () => {
      assert.match(searchJsContent, /setAttribute\s*\(\s*['"]aria-label['"]/,
        'Results container should update aria-label for screen readers');
    });

    test('CSS has visible focus state for copy button', () => {
      assert.match(componentsCssContent, /\.copy-btn:focus\s*\{[^}]*outline/,
        'Copy button should have visible focus outline');
    });
  });

  describe('CSS Styling', () => {
    test('code-value uses monospace font', () => {
      assert.match(componentsCssContent, /\.code-value\s*\{[^}]*font-family:\s*var\(--font-mono\)/,
        'code-value should use monospace font');
    });

    test('code-value has larger font size', () => {
      assert.match(componentsCssContent, /\.code-value\s*\{[^}]*font-size:\s*1\.125rem/,
        'code-value should have 18px (1.125rem) font size');
    });

    test('metadata uses dot separators', () => {
      assert.match(componentsCssContent, /\.code-card-meta > span:not\(:last-child\)::after\s*\{[^}]*content:\s*["'] · ["']/,
        'Metadata spans should have dot separator');
    });

    test('copy button has accent background', () => {
      assert.match(componentsCssContent, /\.copy-btn\s*\{[^}]*background:\s*var\(--color-accent\)/,
        'Copy button should have accent color background');
    });

    test('copy button has white text', () => {
      assert.match(componentsCssContent, /\.copy-btn\s*\{[^}]*color:\s*white/,
        'Copy button should have white text');
    });

    test('copy button has hover state', () => {
      assert.match(componentsCssContent, /\.copy-btn:hover\s*\{/,
        'Copy button should have hover state');
    });
  });

  describe('Code Quality', () => {
    test('search.js escapes HTML in code value', () => {
      assert.match(searchJsContent, /escapeHtml\(item\.code\)/,
        'Should escape HTML in code value');
    });

    test('search.js escapes HTML in brand name', () => {
      assert.match(searchJsContent, /escapeHtml\(item\.brand_name\)/,
        'Should escape HTML in brand name');
    });

    test('search.js escapes HTML in item id', () => {
      assert.match(searchJsContent, /escapeHtml\(item\.id\)/,
        'Should escape HTML in item id');
    });
  });
});

describe('Build Integration (Story 3.3)', () => {
  const projectRoot = process.cwd();

  test('built site includes updated search.js', () => {
    const builtSearchJs = join(projectRoot, '_site', 'js', 'search.js');
    assert.ok(existsSync(builtSearchJs),
      'search.js should be copied to _site/js/');

    const content = readFileSync(builtSearchJs, 'utf-8');
    assert.match(content, /class="copy-btn"/,
      'Built search.js should include copy button');
  });

  test('built site includes updated components.css', () => {
    const builtCss = join(projectRoot, '_site', 'css', 'components.css');
    assert.ok(existsSync(builtCss),
      'components.css should be copied to _site/css/');

    const content = readFileSync(builtCss, 'utf-8');
    assert.match(content, /\.copy-btn/,
      'Built components.css should include copy-btn styles');
  });
});

describe('formatRelativeDate Edge Cases (Story 3.3 - Code Review Fix)', () => {
  const projectRoot = process.cwd();
  const searchJsPath = join(projectRoot, 'public', 'js', 'search.js');
  let searchJsContent;

  before(() => {
    searchJsContent = readFileSync(searchJsPath, 'utf-8');
  });

  test('formatRelativeDate handles null input', () => {
    assert.match(searchJsContent, /if\s*\(\s*!isoDate\s*\)/,
      'Should check for falsy isoDate input');
    assert.match(searchJsContent, /date inconnue/,
      'Should return "date inconnue" for null/undefined');
  });

  test('formatRelativeDate handles invalid date strings', () => {
    assert.match(searchJsContent, /isNaN\s*\(\s*date\.getTime\s*\(\s*\)\s*\)/,
      'Should check for Invalid Date');
    assert.match(searchJsContent, /date invalide/,
      'Should return "date invalide" for invalid date strings');
  });

  test('formatRelativeDate documents intentional duplication', () => {
    assert.match(searchJsContent, /Intentionally duplicated/i,
      'Should document that duplication with .eleventy.js is intentional');
  });
});
