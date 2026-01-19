/**
 * Toast Module - User feedback notifications
 * Story 3.5: Implement Toast Notification
 *
 * Provides:
 * - showToast() function for displaying notifications
 * - Auto-dismiss after configurable duration
 * - Accessibility: role="status", aria-live="polite"
 */

let toastTimeout = null;

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms (default 2000)
 * @param {string} type - Toast type: 'success' (default) or 'error'
 */
export function showToast(message, duration = 2000, type = 'success') {
  const toast = document.getElementById('toast');

  if (!toast) {
    console.log(JSON.stringify({
      event: 'toast_skipped',
      reason: 'element_not_found'
    }));
    return;
  }

  // Clear existing timeout (replace previous toast)
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Remove any existing type classes
  toast.classList.remove('toast--error');

  // Set message and show
  toast.textContent = message;
  toast.classList.add('toast--visible');

  // Add error class if error type
  if (type === 'error') {
    toast.classList.add('toast--error');
  }

  console.log(JSON.stringify({
    event: 'toast_shown',
    message: message
  }));

  // Auto-dismiss
  toastTimeout = setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.classList.remove('toast--error');
    toastTimeout = null;  // Clear reference after dismiss
    console.log(JSON.stringify({
      event: 'toast_dismissed'
    }));
  }, duration);
}
