/**
 * Copy Module - Clipboard API for promo codes
 * Story 3.4: Implement CopyButton with Clipboard API
 * Story 3.5: Toast notification integration
 *
 * Provides:
 * - copyToClipboard() async function with fallback
 * - Event delegation for dynamically rendered copy buttons
 * - Visual feedback (button state change for 2 seconds)
 * - Toast notification on successful copy
 * - Keyboard accessibility support
 */

import { showToast } from './toast.js';

/**
 * Copy text to clipboard using modern Clipboard API with fallback
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log(JSON.stringify({
      event: 'copy_success',
      method: 'clipboard_api'
    }));
    return true;
  } catch {
    // Fallback for older browsers or non-HTTPS contexts
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.setAttribute('aria-hidden', 'true');
    textarea.setAttribute('tabindex', '-1');
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    console.log(JSON.stringify({
      event: success ? 'copy_success' : 'copy_failed',
      method: 'fallback_execCommand'
    }));

    return success;
  }
}

/**
 * Handle copy button click
 * @param {HTMLButtonElement} btn - The copy button element
 * @param {string} code - The code to copy
 */
async function handleCopyClick(btn, code) {
  const success = await copyToClipboard(code);

  // Store original text and aria-label for reset
  const originalText = btn.textContent;
  const originalAriaLabel = btn.getAttribute('aria-label');

  if (success) {
    // Update to copied state
    btn.textContent = 'Copié ✓';
    btn.classList.add('copy-btn--copied');
    btn.setAttribute('aria-label', 'Code copié');

    // Show toast notification (Story 3.5)
    showToast('✓ Code copié');

    // Reset after 2 seconds
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('copy-btn--copied');
      btn.setAttribute('aria-label', originalAriaLabel || `Copier le code ${code}`);
    }, 2000);
  } else {
    // Show error state briefly
    btn.textContent = 'Erreur ✗';
    btn.classList.add('copy-btn--error');
    btn.setAttribute('aria-label', 'Erreur de copie');

    // Show error toast notification (Story 3.5 - Code Review Fix)
    showToast('✗ Erreur de copie', 2000, 'error');

    // Reset after 2 seconds
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('copy-btn--error');
      btn.setAttribute('aria-label', originalAriaLabel || `Copier le code ${code}`);
    }, 2000);
  }
}

/**
 * Initialize copy button functionality with event delegation
 * Handles dynamically rendered buttons from search results
 */
function initCopyButtons() {
  const resultsContainer = document.getElementById('results');

  if (!resultsContainer) {
    console.log(JSON.stringify({
      event: 'copy_init_skipped',
      reason: 'results_container_not_found'
    }));
    return;
  }

  // Event delegation - handle clicks on any .copy-btn within results
  resultsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn');

    // Ignore if not a copy button or already in copied state
    if (!btn || btn.classList.contains('copy-btn--copied')) {
      return;
    }

    // Get code from parent card's data attribute
    const card = btn.closest('.code-card');
    const code = card?.dataset.codeValue;

    if (!code) {
      console.error(JSON.stringify({
        error: 'No code value found',
        code: 'MISSING_CODE_VALUE'
      }));
      return;
    }

    handleCopyClick(btn, code);
  });

  console.log(JSON.stringify({
    event: 'copy_initialized'
  }));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCopyButtons);
} else {
  initCopyButtons();
}

// Export for testing and potential external use
export { copyToClipboard, handleCopyClick, initCopyButtons };
