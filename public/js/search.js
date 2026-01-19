/**
 * Search Module - Fuse.js fuzzy search for promo codes
 * Story 3.2: Implement Fuse.js Fuzzy Search
 *
 * Provides instant client-side search with:
 * - Fuzzy matching on brand_name, brand_slug, code
 * - 50ms debounce for performance
 * - Results sorted by found_at descending
 */

// Import Fuse.js from CDN (no bundler in project)
import Fuse from 'https://esm.sh/fuse.js@7.1.0';

/**
 * Fuse.js configuration per architecture spec
 */
const FUSE_OPTIONS = {
  keys: [
    { name: 'brand_name', weight: 0.7 },
    { name: 'brand_slug', weight: 0.5 },
    { name: 'code', weight: 0.3 }
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2
};

/**
 * Debounce delay in milliseconds (per UX spec)
 */
const DEBOUNCE_DELAY = 50;

/**
 * Module state
 */
let fuse = null;
let codesData = [];

/**
 * Simple debounce utility
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Format relative date in French
 * @param {string} isoDate - ISO 8601 date string
 * @returns {string} Relative date string
 */
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

/**
 * Render search results to the DOM
 * @param {Array} results - Fuse.js search results
 */
function renderResults(results) {
  const container = document.getElementById('results');
  if (!container) return;

  // Clear previous results
  container.innerHTML = '';

  if (!results || results.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucun code trouvé</p>';
    return;
  }

  // Sort by found_at descending (most recent first)
  const sorted = [...results].sort((a, b) => {
    const itemA = a.item || a;
    const itemB = b.item || b;
    return new Date(itemB.found_at) - new Date(itemA.found_at);
  });

  // Render temporary cards (CodeCard component comes in Story 3.3)
  const html = sorted.map(result => {
    const item = result.item || result;
    return `
      <article class="code-card" data-code-id="${item.id}">
        <div class="code-card-main">
          <code class="code-value">${escapeHtml(item.code)}</code>
          <span class="code-brand">${escapeHtml(item.brand_name)}</span>
        </div>
        <div class="code-card-meta">
          <span class="code-date">${formatRelativeDate(item.found_at)}</span>
          ${item.source_channel ? `<span class="code-source">${escapeHtml(item.source_channel)}</span>` : ''}
        </div>
      </article>
    `;
  }).join('');

  container.innerHTML = html;

  // Update aria-live region for screen readers
  const count = sorted.length;
  container.setAttribute('aria-label', `${count} code${count > 1 ? 's' : ''} promo trouvé${count > 1 ? 's' : ''}`);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Perform search with Fuse.js
 * @param {string} query - Search query
 */
function performSearch(query) {
  if (!fuse) {
    console.error(JSON.stringify({ error: 'Fuse.js not initialized', code: 'FUSE_NOT_READY' }));
    return;
  }

  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    // Show all codes sorted by date when query is empty
    renderResults(codesData);
    return;
  }

  if (trimmedQuery.length < 2) {
    // Don't search for single characters
    renderResults([]);
    return;
  }

  const results = fuse.search(trimmedQuery);
  renderResults(results);
}

/**
 * Initialize search functionality
 */
async function initSearch() {
  const searchInput = document.getElementById('search');
  const resultsContainer = document.getElementById('results');

  if (!searchInput || !resultsContainer) {
    console.error(JSON.stringify({ error: 'Search elements not found', code: 'ELEMENTS_NOT_FOUND' }));
    return;
  }

  try {
    // Fetch codes data
    const response = await fetch('/codes.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    codesData = data.codes || [];

    // Initialize Fuse.js
    fuse = new Fuse(codesData, FUSE_OPTIONS);

    console.log(JSON.stringify({
      event: 'search_initialized',
      total_codes: codesData.length
    }));

    // Show all codes initially (sorted by date)
    renderResults(codesData);

    // Bind debounced search to input
    const debouncedSearch = debounce((e) => {
      performSearch(e.target.value);
    }, DEBOUNCE_DELAY);

    searchInput.addEventListener('input', debouncedSearch);

  } catch (error) {
    console.error(JSON.stringify({
      error: 'Failed to initialize search',
      code: 'INIT_ERROR',
      message: error.message
    }));

    // Show error state
    resultsContainer.innerHTML = '<p class="error-state">Erreur de chargement des codes</p>';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearch);
} else {
  initSearch();
}

// Export for testing
export { initSearch, performSearch, renderResults, debounce, formatRelativeDate, FUSE_OPTIONS, DEBOUNCE_DELAY };
