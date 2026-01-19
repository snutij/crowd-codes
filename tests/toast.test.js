import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Tests for Story 3.5: Implement Toast Notification
 *
 * Tests verify:
 * - toast.js module exists and exports showToast function
 * - Toast container has correct ARIA attributes
 * - CSS includes toast positioning styles
 * - Toast integrates with copy.js
 * - Reduced motion support
 */

describe('Toast Module (Story 3.5)', () => {
  const projectRoot = process.cwd();
  const toastJsPath = join(projectRoot, 'public', 'js', 'toast.js');
  let toastJsContent;

  before(() => {
    // Build the site before running tests
    execSync('npm run build', { stdio: 'inherit' });

    // Read file contents
    if (existsSync(toastJsPath)) {
      toastJsContent = readFileSync(toastJsPath, 'utf-8');
    }
  });

  describe('AC#1: Toast shows and auto-dismisses', () => {
    test('toast.js file exists in public/js/', () => {
      assert.ok(existsSync(toastJsPath),
        'public/js/toast.js should exist');
    });

    test('toast.js exports showToast function', () => {
      assert.match(toastJsContent, /export\s+.*showToast/,
        'Should export showToast function');
    });

    test('showToast has default duration of 2000ms', () => {
      assert.match(toastJsContent, /duration\s*=\s*2000/,
        'Should default to 2000ms duration');
    });

    test('showToast uses setTimeout for auto-dismiss', () => {
      assert.match(toastJsContent, /setTimeout/,
        'Should use setTimeout for auto-dismiss');
    });

    test('showToast adds toast--visible class', () => {
      assert.match(toastJsContent, /toast--visible/,
        'Should add toast--visible class to show toast');
    });

    test('showToast sets message via textContent', () => {
      assert.match(toastJsContent, /toast\.textContent\s*=\s*message/,
        'Should set toast text content');
    });

    test('showToast clears previous timeout', () => {
      assert.match(toastJsContent, /clearTimeout/,
        'Should clear previous timeout when showing new toast');
    });

    test('showToast removes toast--visible on dismiss', () => {
      assert.match(toastJsContent, /classList\.remove\(['"']toast--visible['"']\)/,
        'Should remove toast--visible class on dismiss');
    });

    test('showToast uses JSON logging format', () => {
      assert.match(toastJsContent, /JSON\.stringify/,
        'Should use JSON.stringify for structured logging');
    });

    test('showToast supports type parameter for error state', () => {
      assert.match(toastJsContent, /type\s*=\s*['"]success['"]/,
        'Should have type parameter with success default');
    });

    test('showToast adds toast--error class for error type', () => {
      assert.match(toastJsContent, /classList\.add\(['"']toast--error['"']\)/,
        'Should add toast--error class for error type');
    });

    test('showToast clears timeout reference after dismiss', () => {
      assert.match(toastJsContent, /toastTimeout\s*=\s*null/,
        'Should clear toastTimeout after dismiss');
    });
  });

  describe('AC#2: Accessibility attributes', () => {
    test('built HTML includes toast container with role="status"', () => {
      const builtHtml = join(projectRoot, '_site', 'index.html');
      const content = readFileSync(builtHtml, 'utf-8');
      assert.match(content, /id="toast"[^>]*role="status"/,
        'Toast should have role="status"');
    });

    test('built HTML includes toast container with aria-live="polite"', () => {
      const builtHtml = join(projectRoot, '_site', 'index.html');
      const content = readFileSync(builtHtml, 'utf-8');
      assert.match(content, /id="toast"[^>]*aria-live="polite"/,
        'Toast should have aria-live="polite"');
    });

    test('toast container has toast class', () => {
      const builtHtml = join(projectRoot, '_site', 'index.html');
      const content = readFileSync(builtHtml, 'utf-8');
      assert.match(content, /id="toast"[^>]*class="toast"/,
        'Toast should have toast class');
    });
  });
});

describe('Toast CSS (Story 3.5)', () => {
  const projectRoot = process.cwd();
  const componentsPath = join(projectRoot, 'public', 'css', 'components.css');
  let componentsCssContent;

  before(() => {
    if (existsSync(componentsPath)) {
      componentsCssContent = readFileSync(componentsPath, 'utf-8');
    }
  });

  test('.toast class exists in CSS', () => {
    assert.match(componentsCssContent, /\.toast\s*\{/,
      'Should have .toast class');
  });

  test('.toast has fixed positioning', () => {
    assert.match(componentsCssContent, /\.toast\s*\{[^}]*position:\s*fixed/,
      'Toast should have position: fixed');
  });

  test('.toast has bottom positioning', () => {
    assert.match(componentsCssContent, /\.toast\s*\{[^}]*bottom:/,
      'Toast should have bottom positioning');
  });

  test('.toast uses success color for background', () => {
    assert.match(componentsCssContent, /\.toast\s*\{[^}]*background:\s*var\(--color-success\)/,
      'Toast should use --color-success background');
  });

  test('.toast has opacity transition', () => {
    assert.match(componentsCssContent, /\.toast\s*\{[^}]*transition:[^}]*opacity/,
      'Toast should have opacity transition');
  });

  test('.toast starts hidden', () => {
    assert.match(componentsCssContent, /\.toast\s*\{[^}]*opacity:\s*0/,
      'Toast should start with opacity: 0');
    assert.match(componentsCssContent, /\.toast\s*\{[^}]*visibility:\s*hidden/,
      'Toast should start with visibility: hidden');
  });

  test('.toast--visible class exists', () => {
    assert.match(componentsCssContent, /\.toast--visible\s*\{/,
      'Should have .toast--visible class');
  });

  test('.toast--visible shows the toast', () => {
    assert.match(componentsCssContent, /\.toast--visible\s*\{[^}]*opacity:\s*1/,
      'toast--visible should set opacity: 1');
    assert.match(componentsCssContent, /\.toast--visible\s*\{[^}]*visibility:\s*visible/,
      'toast--visible should set visibility: visible');
  });

  test('.toast has z-index for layering', () => {
    assert.match(componentsCssContent, /\.toast\s*\{[^}]*z-index:/,
      'Toast should have z-index');
  });

  test('desktop media query positions toast to the right', () => {
    assert.match(componentsCssContent, /@media\s*\(min-width:\s*768px\)[^{]*\{[^}]*\.toast\s*\{[^}]*right:/,
      'Desktop should position toast to the right');
  });

  test('prefers-reduced-motion disables transitions', () => {
    assert.match(componentsCssContent, /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
      'Should have prefers-reduced-motion media query');
    assert.match(componentsCssContent, /prefers-reduced-motion:\s*reduce\)[^{]*\{[^}]*\.toast\s*\{[^}]*transition:\s*none/,
      'Should disable transitions for reduced motion');
  });

  test('.toast--error class exists for error state', () => {
    assert.match(componentsCssContent, /\.toast--error\s*\{/,
      'Should have .toast--error class for error toasts');
  });

  test('.toast--error uses error color', () => {
    assert.match(componentsCssContent, /\.toast--error\s*\{[^}]*background:\s*var\(--color-error/,
      'toast--error should use --color-error for background');
  });
});

describe('Toast Integration (Story 3.5)', () => {
  const projectRoot = process.cwd();

  describe('copy.js integration', () => {
    test('copy.js imports showToast from toast.js', () => {
      const copyJsPath = join(projectRoot, 'public', 'js', 'copy.js');
      const content = readFileSync(copyJsPath, 'utf-8');
      assert.match(content, /import\s*\{[^}]*showToast[^}]*\}\s*from\s*['"]\.\/toast\.js['"]/,
        'copy.js should import showToast from toast.js');
    });

    test('copy.js calls showToast on successful copy', () => {
      const copyJsPath = join(projectRoot, 'public', 'js', 'copy.js');
      const content = readFileSync(copyJsPath, 'utf-8');
      assert.match(content, /showToast\(['"']✓ Code copié['"']\)/,
        'copy.js should call showToast with French message');
    });

    test('copy.js calls showToast with error type on copy failure', () => {
      const copyJsPath = join(projectRoot, 'public', 'js', 'copy.js');
      const content = readFileSync(copyJsPath, 'utf-8');
      assert.match(content, /showToast\(['"']✗ Erreur de copie['"'],\s*2000,\s*['"']error['"']\)/,
        'copy.js should call showToast with error type on failure');
    });

    test('toast.js is loaded via ES module import not separate script tag', () => {
      const baseNjkPath = join(projectRoot, 'src', '_includes', 'base.njk');
      const content = readFileSync(baseNjkPath, 'utf-8');
      assert.doesNotMatch(content, /src=["']\/js\/toast\.js["']/,
        'base.njk should NOT have separate toast.js script tag (loaded via import in copy.js)');
    });
  });

  describe('Build integration', () => {
    test('built site includes toast.js', () => {
      const builtToastJs = join(projectRoot, '_site', 'js', 'toast.js');
      assert.ok(existsSync(builtToastJs),
        'toast.js should be copied to _site/js/');
    });

    test('built components.css includes toast styles', () => {
      const builtCss = join(projectRoot, '_site', 'css', 'components.css');
      const content = readFileSync(builtCss, 'utf-8');
      assert.match(content, /\.toast/,
        'Built components.css should include .toast');
    });
  });
});
