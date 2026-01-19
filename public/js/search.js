/**
 * Search Module - Fuse.js fuzzy search for promo codes
 * Story 3.2: Implement Fuse.js Fuzzy Search
 * Story 3.6: Implement Empty State & Error Handling
 *
 * Provides instant client-side search with:
 * - Fuzzy matching on brand_name, brand_slug, code
 * - 50ms debounce for performance
 * - Results sorted by found_at descending
 * - Empathetic empty state with brand context (3.6)
 * - Distinct error state with guidance (3.6)
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
 * NOTE: Intentionally duplicated in .eleventy.js for SSR - no bundler in project
 * @param {string} isoDate - ISO 8601 date string
 * @returns {string} Relative date string
 */
function formatRelativeDate(isoDate) {
  // Validate input - return fallback for invalid dates
  if (!isoDate) return 'date inconnue';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return 'date invalide';
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
 * Render empathetic empty state (Story 3.6)
 * @param {string} query - The search query (for context)
 */
function renderEmptyState(query) {
  const container = document.getElementById('results');
  if (!container) return;

  const escapedQuery = escapeHtml(query);
  const hasQuery = escapedQuery && escapedQuery.trim().length > 0;

  container.innerHTML = `
    <div class="empty-state" role="status">
      <p class="empty-state-title">
        ${hasQuery
          ? `Aucun code trouvé pour « ${escapedQuery} »`
          : 'Aucun code promo disponible'}
      </p>
      <p class="empty-state-message">
        Nous surveillons les influenceurs YouTube chaque jour.
      </p>
      <p class="empty-state-suggestion">
        ${hasQuery
          ? 'Vérifiez l\'orthographe ou essayez une autre marque.'
          : 'Revenez bientôt pour découvrir de nouveaux codes.'}
      </p>
    </div>
  `;

  container.setAttribute('aria-label', 'Aucun résultat');

  console.log(JSON.stringify({
    event: 'empty_state_shown',
    query: query || null
  }));
}

/**
 * Render error state (Story 3.6)
 * @param {string} errorMessage - Technical error message for logging
 */
function renderErrorState(errorMessage) {
  const container = document.getElementById('results');
  if (!container) return;

  container.innerHTML = `
    <div class="error-state" role="alert">
      <p class="error-state-title">Oups, une erreur s'est produite</p>
      <p class="error-state-message">
        Impossible de charger les codes promo.
      </p>
      <p class="error-state-suggestion">
        Vérifiez votre connexion internet et rechargez la page.
      </p>
    </div>
  `;

  container.setAttribute('aria-label', 'Erreur de chargement');

  console.error(JSON.stringify({
    event: 'error_state_shown',
    error: errorMessage
  }));
}

/**
 * Render search results to the DOM
 * Uses CodeCard component structure (Story 3.3)
 * @param {Array} results - Fuse.js search results or raw code objects
 * @param {string} query - The search query (for empty state context)
 */
function renderResults(results, query) {
  const container = document.getElementById('results');
  if (!container) return;

  // Clear previous results
  container.innerHTML = '';

  if (!results || results.length === 0) {
    renderEmptyState(query);
    return;
  }

  // Sort by found_at descending (most recent first)
  const sorted = [...results].sort((a, b) => {
    const itemA = a.item || a;
    const itemB = b.item || b;
    return new Date(itemB.found_at) - new Date(itemA.found_at);
  });

  // Render CodeCard components (Story 3.3)
  // Structure: code + button same row, metadata below with dot separators
  const html = sorted.map(result => {
    const item = result.item || result;
    const escapedCode = escapeHtml(item.code);
    const escapedBrand = escapeHtml(item.brand_name);
    const relativeDate = formatRelativeDate(item.found_at);
    const escapedSource = item.source_channel ? escapeHtml(item.source_channel) : '';

    return `
      <article class="code-card" data-code-id="${escapeHtml(item.id)}" data-code-value="${escapedCode}">
        <div class="code-card-main">
          <code class="code-value">${escapedCode}</code>
          <button class="copy-btn" type="button" aria-label="Copier le code ${escapedCode}">Copier</button>
        </div>
        <div class="code-card-meta">
          <span class="code-brand">${escapedBrand}</span>
          <span class="code-date">${relativeDate}</span>
          ${escapedSource ? `<span class="code-source">${escapedSource}</span>` : ''}
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
    renderResults(codesData, '');
    return;
  }

  if (trimmedQuery.length < 2) {
    // Don't search for single characters - show empty state without query context
    renderResults([], '');
    return;
  }

  const results = fuse.search(trimmedQuery);
  renderResults(results, trimmedQuery);
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

    // Parse JSON with explicit error handling (Story 3.6)
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error(`JSON_PARSE_ERROR: ${parseError.message}`);
    }
    codesData = data.codes || [];

    // Initialize Fuse.js
    fuse = new Fuse(codesData, FUSE_OPTIONS);

    console.log(JSON.stringify({
      event: 'search_initialized',
      total_codes: codesData.length
    }));

    // Show all codes initially (sorted by date)
    renderResults(codesData, '');

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

    // Show error state (Story 3.6)
    renderErrorState(error.message);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearch);
} else {
  initSearch();
}

// Export for testing
export { initSearch, performSearch, renderResults, renderEmptyState, renderErrorState, debounce, formatRelativeDate, FUSE_OPTIONS, DEBOUNCE_DELAY };
