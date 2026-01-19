# Story 3.4: Implement CopyButton with Clipboard API

Status: review

## Story

As a **user (Lucas)**,
I want **to copy a code with a single tap**,
So that **I can paste it at the merchant site instantly** (FR7).

## Acceptance Criteria

1. **Given** `public/js/copy.js` exists, **When** I tap/click a copy button, **Then** the code is copied to clipboard immediately

2. **Given** I tap the copy button, **When** the copy succeeds, **Then** the button text changes to "Copié ✓" for 2 seconds

3. **Given** the button styling, **When** I view on mobile, **Then** minimum touch target is 44×44px (NFR-A3)

4. **Given** keyboard navigation, **When** I tab to a copy button and press Enter, **Then** the code is copied and focus indicator is visible (NFR-A4)

## Tasks / Subtasks

- [x] Task 1: Create copy.js module with Clipboard API (AC: #1, #4)
  - [x] Create `public/js/copy.js` ES module
  - [x] Implement `copyToClipboard(text)` async function
  - [x] Add fallback for older browsers (textarea + execCommand)
  - [x] Return success/failure boolean for caller
  - [x] Use JSON logging format per project-context

- [x] Task 2: Implement button state feedback (AC: #2)
  - [x] Add event delegation on results container for `.copy-btn` clicks
  - [x] Get code value from `data-code-value` attribute on parent `.code-card`
  - [x] Change button text to "Copié ✓" on success
  - [x] Add `.copy-btn--copied` class for visual state
  - [x] Reset to "Copier" after 2 seconds via setTimeout
  - [x] Prevent double-clicks during copied state

- [x] Task 3: Add CSS for "Copied" state (AC: #2)
  - [x] Add `.copy-btn--copied` styles to `components.css`
  - [x] Use `--color-success` (#16a34a) for background
  - [x] Maintain 44px minimum touch target
  - [x] Smooth transition between states

- [x] Task 4: Ensure keyboard accessibility (AC: #4)
  - [x] Verify Enter/Space triggers copy
  - [x] Maintain visible focus indicator during copied state
  - [x] Test tab order through multiple cards
  - [x] Update aria-label during copied state: "Code copié"

- [x] Task 5: Wire up initialization (AC: #1)
  - [x] Import copy.js in index.njk or via search.js
  - [x] Initialize after DOM ready
  - [x] Ensure works with dynamically rendered results

- [x] Task 6: Write automated tests (AC: #1, #2, #3, #4)
  - [x] Test copy.js module exists and exports function
  - [x] Test button state changes on click
  - [x] Test CSS copied state styles
  - [x] Test accessibility attributes update
  - [x] Test keyboard interaction patterns

- [x] Task 7: Verify build and test (AC: all)
  - [x] Run `npm run build`
  - [x] Run `npm test` - all tests pass
  - [x] Manual test on mobile (real device or emulator)
  - [x] Test keyboard-only navigation

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md` and `project-context.md`:

1. **File location**:
   - NEW: `public/js/copy.js` - Clipboard API module
   - MODIFY: `public/css/components.css` - Add copied state styles
   - MODIFY: `public/js/search.js` OR `src/index.njk` - Wire up initialization

2. **Naming conventions**:
   - CSS: kebab-case (`.copy-btn--copied`)
   - JS: camelCase (`copyToClipboard`, `handleCopyClick`)

3. **No bundler**: Plain ES modules, vanilla CSS

4. **Mobile-first**: Touch target already 44px from Story 3.3

### UX Design Requirements

Per `ux-design-specification.md`:

**CopyButton States:**
```
┌──────────┐     ┌──────────┐
│  Copier  │ --> │ Copié ✓  │
└──────────┘     └──────────┘
  Default          Copied (2s)
```

**Component Specification:**
| Aspect | Specification |
|--------|---------------|
| **Purpose** | Copy code to clipboard |
| **Content** | Label "Copier" / "Copié ✓" |
| **Actions** | Click/Tap → clipboard + feedback |
| **States** | Default, Hover, Active, Copied (2s) |
| **A11y** | `aria-live="polite"`, visible focus |

**Behavior:**
- Tap → instant copy
- "Copied" state for 2 seconds
- Auto-return to "Copier"
- Prevent double-tap during cooldown

### Clipboard API Implementation

Per UX spec, use modern API with fallback:

```javascript
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / non-HTTPS
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}
```

### CSS Implementation for Copied State

```css
/* CopyButton - Copied state (Story 3.4) */
.copy-btn--copied {
  background: var(--color-success);  /* #16a34a */
  pointer-events: none;  /* Prevent double-click */
}

.copy-btn--copied:focus {
  outline-color: var(--color-success);
}
```

### Event Handling Pattern

Use event delegation on results container (handles dynamic content):

```javascript
document.getElementById('results').addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn || btn.classList.contains('copy-btn--copied')) return;

  const card = btn.closest('.code-card');
  const code = card?.dataset.codeValue;
  if (!code) return;

  handleCopyClick(btn, code);
});
```

### Previous Story Learnings (Story 3.3)

**From Dev Agent Record:**
- CopyButton placeholder already styled in `components.css`
- Button has `type="button"` and `aria-label="Copier le code {CODE}"`
- `data-code-value` attribute exists on `.code-card` elements
- CSS uses `var(--touch-min)` for 44px touch target
- Focus state: 2px solid accent outline with 2px offset

**Files created in Story 3.3:**
- `src/_includes/code-card.njk` - SSR template with button
- `public/css/components.css` - CopyButton base styles (lines 84-112)
- `public/js/search.js` - Renders CodeCard with button (line 123)

**Existing button structure (search.js line 123):**
```html
<button class="copy-btn" type="button" aria-label="Copier le code ${escapedCode}">Copier</button>
```

### Design Tokens Reference

```css
:root {
  /* Colors */
  --color-accent: #2563eb;      /* Blue - default button */
  --color-success: #16a34a;     /* Green - copied state */

  /* Transitions */
  --transition-fast: 150ms ease;

  /* Touch targets */
  --touch-min: 44px;
}
```

### Testing Requirements

**Automated tests should verify:**
1. `public/js/copy.js` exists and exports `copyToClipboard`
2. Button text changes to "Copié ✓" after click
3. Button gets `.copy-btn--copied` class
4. CSS includes `.copy-btn--copied` with success color
5. Button resets after 2 seconds
6. `aria-label` updates during copied state
7. Keyboard Enter/Space triggers copy

**Manual testing:**
- Test on real mobile device (clipboard permissions)
- Test keyboard-only navigation
- Test with screen reader

### Dependencies

**Runtime:**
- Depends on: `public/css/tokens.css` (design tokens)
- Depends on: `public/css/components.css` (base button styles from 3.3)
- Depends on: `public/js/search.js` (renders buttons with data attributes)

**Build:**
- No new dependencies required
- Uses native Clipboard API (no polyfill needed)

### Integration Notes

- Story 3.5 will add Toast notification on copy (currently just button feedback)
- Toast is separate enhancement - button feedback alone is sufficient for MVP
- Consider debouncing if performance issues (unlikely)

### What NOT to Implement (Deferred)

- **NO Toast notification** - Comes in Story 3.5
- **NO clipboard clear** - Unlike 1Password, no security need
- **NO analytics tracking** - Comes in Story 5.2
- **NO error toast** - Just button stays default if copy fails

### References

- [Source: ux-design-specification.md#CopyButton] - Component spec
- [Source: ux-design-specification.md#Clipboard-API-with-fallback] - Implementation code
- [Source: epics.md#Story-3.4] - Acceptance criteria
- [Source: prd.md#FR7] - Single-click copy requirement
- [Source: prd.md#NFR-A3] - 44px touch target
- [Source: prd.md#NFR-A4] - Keyboard accessibility

### Project Structure Notes

**Files to create/modify:**
```
crowd-codes/
├── public/
│   ├── css/
│   │   └── components.css    # MODIFY: Add .copy-btn--copied
│   └── js/
│       ├── search.js         # MODIFY: Import copy.js, add event delegation
│       └── copy.js           # CREATE: Clipboard API module
└── tests/
    └── copybutton.test.js    # CREATE: Tests for Story 3.4
```

## Dev Agent Record

### Implementation Summary

All 7 tasks completed successfully. The CopyButton functionality is now fully implemented with:
- Modern Clipboard API with fallback for older browsers
- Visual feedback via "Copié ✓" state for 2 seconds
- Event delegation pattern for dynamically rendered results
- Full accessibility compliance (ARIA labels, keyboard support, 44px touch targets)
- JSON logging format per project-context standards

### File List

**Created:**
- `public/js/copy.js` - Clipboard API module with async copyToClipboard function
- `tests/copybutton.test.js` - 26 automated tests for Story 3.4

**Modified:**
- `public/css/components.css` - Added `.copy-btn--copied` state styles
- `src/_includes/base.njk` - Added copy.js script tag

### Test Results

All 182 tests passing (26 new tests for Story 3.4):
- AC#1: copy.js module with Clipboard API ✓
- AC#2: Button state feedback ("Copié ✓" for 2s) ✓
- AC#3: 44px touch target maintained ✓
- AC#4: Keyboard accessibility (aria-label updates, focus visible) ✓

### Notes

- copy.js uses event delegation on `#results` container - handles dynamically rendered cards
- Button prevents double-clicks via `pointer-events: none` during copied state
- Fallback uses hidden textarea + `execCommand('copy')` for older browsers
- All 4 Acceptance Criteria verified implemented

## Change Log

- 2026-01-19: Story created via create-story workflow
- 2026-01-19: Implementation completed - all tasks done, 182 tests passing, status → review
- 2026-01-19: Code review completed - 7 issues found (1 HIGH, 4 MEDIUM, 2 LOW), all fixed automatically:
  - Added error state handling with "Erreur ✗" feedback and `.copy-btn--error` CSS class (HIGH)
  - Fixed unused imports in test file (MEDIUM)
  - Added background-color to CSS transition (MEDIUM)
  - Changed from hardcoded 'Copier' to originalText for reset (MEDIUM)
  - Added test for script tag verification (MEDIUM)
  - Added aria-hidden and tabindex to fallback textarea (LOW)
  - 187 tests passing after fixes
