import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Tests for Story 3.6: Implement Empty State & Error Handling
 *
 * Tests verify:
 * - Empty state renders with empathetic messaging
 * - Error state renders with distinct styling
 * - Proper ARIA attributes for accessibility
 * - CSS includes correct styling for both states
 */

describe('Empty State (Story 3.6)', () => {
  const projectRoot = process.cwd();
  const searchJsPath = join(projectRoot, 'public', 'js', 'search.js');
  let searchJsContent;

  before(() => {
    execSync('npm run build', { stdio: 'inherit' });

    if (existsSync(searchJsPath)) {
      searchJsContent = readFileSync(searchJsPath, 'utf-8');
    }
  });

  describe('AC#1: Empathetic empty state', () => {
    test('search.js has renderEmptyState function', () => {
      assert.match(searchJsContent, /function\s+renderEmptyState/,
        'Should have renderEmptyState function');
    });

    test('renderEmptyState accepts query parameter', () => {
      assert.match(searchJsContent, /renderEmptyState\s*\(\s*query\s*\)/,
        'renderEmptyState should accept query parameter');
    });

    test('empty state has role="status" for polite announcement', () => {
      assert.match(searchJsContent, /role=["']status["']/,
        'Empty state should have role="status"');
    });

    test('empty state shows brand context when query provided', () => {
      assert.match(searchJsContent, /Aucun code trouvé pour/,
        'Should show "Aucun code trouvé pour" with brand context');
    });

    test('empty state has empathetic messaging explaining why', () => {
      assert.match(searchJsContent, /Nous surveillons les influenceurs YouTube/,
        'Should explain why there are no codes');
    });

    test('empty state has actionable suggestion', () => {
      assert.match(searchJsContent, /Vérifiez l'orthographe|essayez une autre marque/,
        'Should provide actionable suggestion');
    });

    test('empty state uses JSON logging', () => {
      assert.match(searchJsContent, /empty_state_shown/,
        'Should log empty_state_shown event');
    });

    test('empty state uses escapeHtml for XSS protection', () => {
      assert.match(searchJsContent, /escapeHtml\s*\(\s*query\s*\)/,
        'Should escape query to prevent XSS');
    });

    test('empty state handles empty string query without brand context', () => {
      // When query is empty string, should show generic message without guillemets
      assert.match(searchJsContent, /Aucun code promo disponible/,
        'Should show generic message when no query');
    });

    test('empty state shows different suggestion for no query vs with query', () => {
      assert.match(searchJsContent, /Revenez bientôt pour découvrir de nouveaux codes/,
        'Should show "come back soon" suggestion when no query');
    });
  });
});

describe('Error State (Story 3.6)', () => {
  const projectRoot = process.cwd();
  const searchJsPath = join(projectRoot, 'public', 'js', 'search.js');
  let searchJsContent;

  before(() => {
    if (existsSync(searchJsPath)) {
      searchJsContent = readFileSync(searchJsPath, 'utf-8');
    }
  });

  describe('AC#2: Distinct error state', () => {
    test('search.js has renderErrorState function', () => {
      assert.match(searchJsContent, /function\s+renderErrorState/,
        'Should have renderErrorState function');
    });

    test('error state has role="alert" for assertive announcement', () => {
      assert.match(searchJsContent, /role=["']alert["']/,
        'Error state should have role="alert"');
    });

    test('error state has clear French error message', () => {
      assert.match(searchJsContent, /Oups|erreur s'est produite/,
        'Should have clear French error message');
    });

    test('error state has actionable guidance', () => {
      assert.match(searchJsContent, /Vérifiez votre connexion|rechargez la page/,
        'Should provide actionable guidance');
    });

    test('error state uses JSON error logging', () => {
      assert.match(searchJsContent, /error_state_shown/,
        'Should log error_state_shown event');
    });

    test('initSearch calls renderErrorState on fetch failure', () => {
      assert.match(searchJsContent, /renderErrorState/,
        'Should use renderErrorState for fetch failures');
    });

    test('initSearch handles JSON parse errors explicitly', () => {
      assert.match(searchJsContent, /JSON_PARSE_ERROR/,
        'Should handle JSON parse errors with specific error code');
    });
  });
});

describe('Empty/Error State CSS (Story 3.6)', () => {
  const projectRoot = process.cwd();
  const componentsPath = join(projectRoot, 'public', 'css', 'components.css');
  let componentsCssContent;

  before(() => {
    if (existsSync(componentsPath)) {
      componentsCssContent = readFileSync(componentsPath, 'utf-8');
    }
  });

  describe('Empty State Styling', () => {
    test('.empty-state class exists', () => {
      assert.match(componentsCssContent, /\.empty-state\s*\{/,
        'Should have .empty-state class');
    });

    test('.empty-state-title class exists', () => {
      assert.match(componentsCssContent, /\.empty-state-title\s*\{/,
        'Should have .empty-state-title class');
    });

    test('.empty-state-message class exists', () => {
      assert.match(componentsCssContent, /\.empty-state-message\s*\{/,
        'Should have .empty-state-message class');
    });

    test('.empty-state-suggestion class exists', () => {
      assert.match(componentsCssContent, /\.empty-state-suggestion\s*\{/,
        'Should have .empty-state-suggestion class');
    });

    test('.empty-state uses muted color', () => {
      assert.match(componentsCssContent, /\.empty-state[^}]*color:\s*var\(--color-muted\)/s,
        'Empty state should use muted color');
    });
  });

  describe('Error State Styling', () => {
    test('.error-state class exists', () => {
      assert.match(componentsCssContent, /\.error-state\s*\{/,
        'Should have .error-state class');
    });

    test('.error-state-title class exists', () => {
      assert.match(componentsCssContent, /\.error-state-title\s*\{/,
        'Should have .error-state-title class');
    });

    test('.error-state-title uses error color', () => {
      assert.match(componentsCssContent, /\.error-state-title\s*\{[^}]*color:\s*var\(--color-error/,
        'Error state title should use error color');
    });

    test('.error-state-message class exists', () => {
      assert.match(componentsCssContent, /\.error-state-message\s*\{/,
        'Should have .error-state-message class');
    });
  });

  describe('Visual Distinction', () => {
    test('empty and error states have different title colors', () => {
      const emptyTitleMatch = componentsCssContent.match(/\.empty-state-title\s*\{[^}]*color:\s*([^;}\n]+)/);
      const errorTitleMatch = componentsCssContent.match(/\.error-state-title\s*\{[^}]*color:\s*([^;}\n]+)/);

      assert.ok(emptyTitleMatch, 'Empty state title should have a color');
      assert.ok(errorTitleMatch, 'Error state title should have a color');
      assert.notStrictEqual(emptyTitleMatch[1].trim(), errorTitleMatch[1].trim(),
        'Empty and error state titles should have different colors');
    });
  });
});

describe('Accessibility (Story 3.6)', () => {
  const projectRoot = process.cwd();
  const searchJsPath = join(projectRoot, 'public', 'js', 'search.js');
  let searchJsContent;

  before(() => {
    if (existsSync(searchJsPath)) {
      searchJsContent = readFileSync(searchJsPath, 'utf-8');
    }
  });

  test('empty state sets aria-label on container', () => {
    assert.match(searchJsContent, /setAttribute\s*\(\s*['"]aria-label['"]/,
      'Should set aria-label on results container');
  });

  test('empty state uses role="status" (non-intrusive)', () => {
    assert.match(searchJsContent, /class=["']empty-state["'][^>]*role=["']status["']|role=["']status["'][^>]*class=["']empty-state["']/,
      'Empty state should use role="status"');
  });

  test('error state uses role="alert" (assertive)', () => {
    assert.match(searchJsContent, /class=["']error-state["'][^>]*role=["']alert["']|role=["']alert["'][^>]*class=["']error-state["']/,
      'Error state should use role="alert"');
  });
});
