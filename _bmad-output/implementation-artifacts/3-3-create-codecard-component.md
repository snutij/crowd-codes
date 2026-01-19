# Story 3.3: Create CodeCard Component

Status: done

## Story

As a **user (Lucas)**,
I want **to see each code with its source and date clearly displayed**,
So that **I can judge freshness and trustworthiness** (FR9, FR10).

## Acceptance Criteria

1. **Given** a code exists in search results, **When** it renders, **Then** CodeCard displays: code in monospace, brand name, relative date, source channel

2. **Given** the page renders on mobile, **When** I view a CodeCard, **Then** code and copy button are on the same row, metadata below

3. **Given** a code has `found_at` timestamp, **When** it renders, **Then** date shows relative time in French ("il y a 2 jours", "hier", etc.)

4. **Given** the CodeCard component exists, **When** search.js renders results, **Then** it uses the new component structure (refactored from inline HTML)

## Tasks / Subtasks

- [x] Task 1: Extract CodeCard markup to Nunjucks partial (AC: #1, #4)
  - [x] Create `src/_includes/code-card.njk` partial
  - [x] Define component structure matching UX spec anatomy
  - [x] Include semantic HTML (`<article>`, `<code>`)
  - [x] Add data-attributes for JS interaction (`data-code-id`, `data-code-value`)

- [x] Task 2: Enhance CodeCard CSS styling (AC: #1, #2)
  - [x] Refactor temporary styles in `public/css/components.css`
  - [x] Implement mobile-first layout: code + button same row
  - [x] Metadata row below (brand · date · source)
  - [x] Code displayed in monospace, larger font (`--font-mono`, `1.125rem`)
  - [x] Ensure touch targets meet 44px minimum

- [x] Task 3: Update search.js to use new component structure (AC: #4)
  - [x] Refactor `renderResults()` to generate CodeCard-compliant HTML
  - [x] Move formatRelativeDate() to shared utility (if reused)
  - [x] Ensure escapeHtml() used for all dynamic content
  - [x] Maintain aria-label updates for accessibility

- [x] Task 4: Add placeholder for CopyButton (AC: #2)
  - [x] Add button element with class `.copy-btn`
  - [x] Placeholder text "Copier" (functionality comes in Story 3.4)
  - [x] Position: right-aligned on same row as code
  - [x] Style: `--color-accent` background, white text, min-height 44px

- [x] Task 5: Ensure accessibility compliance (AC: #1, #2)
  - [x] `<article>` wrapper for each card
  - [x] `<code>` element for promo code text
  - [x] `aria-label` on button: "Copier le code {CODE}"
  - [x] Verify keyboard navigation works (tab order)
  - [x] Test with VoiceOver/screen reader

- [x] Task 6: Write automated tests (AC: #1, #2, #3)
  - [x] Test CodeCard HTML structure matches spec
  - [x] Test mobile layout (code + button same row)
  - [x] Test French relative date display
  - [x] Test accessibility attributes present

- [x] Task 7: Verify build and visual review (AC: #1, #2)
  - [x] Run `npm run build`
  - [x] Visual inspection on mobile viewport (375px)
  - [x] Visual inspection on desktop (768px+)
  - [x] Verify monospace font rendering for codes

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md` and `project-context.md`:

1. **File location**:
   - CSS: `public/css/components.css`
   - JS: `public/js/search.js` (refactor existing)
   - Template: `src/_includes/code-card.njk` (optional - for server-rendered pages)
2. **Naming conventions**:
   - CSS: kebab-case (`.code-card`, `.code-value`, `.code-meta`)
   - JS: camelCase for variables/functions
3. **No bundler**: Plain ES modules, vanilla CSS
4. **Mobile-first**: All CSS starts mobile, enhance for desktop via media query

### UX Design Requirements

Per `ux-design-specification.md`:

**CodeCard Anatomy:**
```
┌─────────────────────────────────────────┐
│  NORD50                    [Copier]     │
│  NordVPN · il y a 2 jours · LTT         │
└─────────────────────────────────────────┘
```

**Component Specification:**
| Aspect | Specification |
|--------|---------------|
| **Purpose** | Display a promo code with metadata |
| **Content** | Code (monospace), brand, relative date, source |
| **Actions** | Copy (via integrated CopyButton) |
| **States** | Default, Hover (desktop), Copied |
| **A11y** | `article` semantic, code in `<code>` |

**Visual Rules (Brutalist Minimal direction):**
- No shadows, gradients, or decorative borders
- Separators: 1px lines (`--color-border`) or whitespace only
- Hierarchy through typography weight and size only
- Code displayed in monospace, larger than surrounding text

### CSS Implementation

```css
/* CodeCard - Mobile first */
.code-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.code-card-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}

.code-value {
  font-family: var(--font-mono);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-text);
}

.code-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.code-card-meta > span:not(:last-child)::after {
  content: " · ";
}

.copy-btn {
  min-height: var(--touch-min);
  min-width: 80px;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: var(--font-size-base);
  cursor: pointer;
}

.copy-btn:hover {
  opacity: 0.9;
}

.copy-btn:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### HTML Structure

```html
<article class="code-card" data-code-id="{id}" data-code-value="{code}">
  <div class="code-card-main">
    <code class="code-value">{code}</code>
    <button class="copy-btn" aria-label="Copier le code {code}">Copier</button>
  </div>
  <div class="code-card-meta">
    <span class="code-brand">{brand_name}</span>
    <span class="code-date">{relative_date}</span>
    <span class="code-source">{source_channel}</span>
  </div>
</article>
```

### Previous Story Learnings

**From Story 3.2:**
- `formatRelativeDate()` already implemented in `search.js` - returns French relative dates
- `escapeHtml()` function exists for XSS prevention
- Temporary CodeCard styles already in `components.css` - need enhancement
- `renderResults()` generates inline HTML - refactor to use new structure
- aria-label updates implemented for result count

**Existing code to refactor (search.js lines 105-119):**
```javascript
// Current temporary implementation
container.innerHTML = sorted.map(result => {
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
```

### Design Tokens Reference

```css
:root {
  /* Colors */
  --color-accent: #2563eb;       /* Blue - action buttons */
  --color-text: #1a1a1a;         /* Main text */
  --color-muted: #6b7280;        /* Metadata */
  --color-border: #e5e7eb;       /* Separators */

  /* Typography */
  --font-mono: ui-monospace, monospace;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;

  /* Touch targets */
  --touch-min: 44px;
}
```

### Testing Requirements

**Automated tests should verify:**
1. CodeCard HTML structure matches specification
2. Mobile layout: code and button on same row (flexbox)
3. Metadata displays in correct order (brand · date · source)
4. French relative dates render correctly
5. Accessibility attributes present (`aria-label` on button)
6. Touch target minimum 44px met

**Browser testing:**
- Mobile viewport (375px) - verify layout
- Desktop viewport (768px+) - verify hover states
- Monospace font rendering for code values

### Dependencies

**Runtime:**
- Depends on: Design tokens in `public/css/tokens.css`
- Depends on: `formatRelativeDate()` from `search.js`
- Depends on: `escapeHtml()` from `search.js`

**Files:**
- Depends on: Story 3.2 implementation (search.js exists and works)
- Depends on: `public/css/components.css` (temporary styles exist)

### Accessibility Notes

Per UX spec WCAG 2.1 AA compliance:

- `<article>` semantic wrapper for screen readers
- `<code>` element for promo code (semantic meaning)
- `aria-label="Copier le code {CODE}"` on button
- Touch targets ≥ 44px (Apple HIG minimum)
- Visible focus state (blue outline)
- Keyboard navigation: Tab through cards and buttons

### References

- [Source: architecture.md#Frontend-Architecture] - Client JS structure
- [Source: ux-design-specification.md#Component-Strategy] - CodeCard spec
- [Source: ux-design-specification.md#Design-Tokens] - CSS variables
- [Source: prd.md#FR9] - Display found codes with source
- [Source: prd.md#FR10] - Display date found

### Project Structure Notes

**Files to modify:**
```
crowd-codes/
├── public/
│   ├── css/
│   │   └── components.css    # MODIFY: Enhance CodeCard styles
│   └── js/
│       └── search.js         # MODIFY: Refactor renderResults()
└── src/
    └── _includes/
        └── code-card.njk     # CREATE (optional): For SSR brand pages
```

### Integration Notes

- Story 3.4 will add CopyButton functionality (clipboard copy)
- Story 3.5 will add Toast notification on copy
- Story 3.7 will use CodeCard on brand pages (SSR Nunjucks)

### What NOT to Implement (Deferred)

- **NO copy functionality** - Button is placeholder, comes in Story 3.4
- **NO toast notifications** - Comes in Story 3.5
- **NO hover state animations** - Simple opacity change only
- **NO card shadows or borders** - Brutalist minimal per UX spec

## Dev Agent Record

### Implementation Summary

All 7 tasks completed successfully. The CodeCard component now matches the UX specification with:
- Mobile-first flexbox layout (code + button same row)
- Metadata row with dot separators (brand · date · source)
- French relative date formatting via `formatRelativeDate()` filter
- Full accessibility compliance (ARIA labels, semantic HTML, 44px touch targets)
- XSS prevention via `escapeHtml()` on all dynamic content

### File List

**Created:**
- `src/_includes/code-card.njk` - Nunjucks partial for SSR brand pages
- `tests/codecard.test.js` - 39 automated tests for Story 3.3 (36 original + 3 code review)

**Modified:**
- `.eleventy.js` - Added `formatRelativeDate` filter with input validation
- `public/css/components.css` - Enhanced CodeCard CSS with flexbox layout, CopyButton styling, dot separators
- `public/js/search.js` - Refactored `renderResults()` with input validation for formatRelativeDate

### Test Results

All 157 tests passing (39 tests for Story 3.3 after code review):
- AC#1: CodeCard displays code, brand, date, source ✓
- AC#2: Mobile layout - code and button same row ✓
- AC#3: French relative date display ✓
- AC#4: Uses new component structure ✓
- Accessibility compliance ✓
- CSS styling ✓
- Code quality (XSS prevention) ✓

### Notes

- `formatRelativeDate()` duplicated in both `.eleventy.js` (for SSR) and `search.js` (for client-side rendering) - intentional to avoid bundler complexity
- CopyButton is placeholder only - functionality comes in Story 3.4
- Build verified: all assets copied to `_site/` correctly

## Senior Developer Review (AI)

**Reviewer:** Code Review Workflow
**Date:** 2026-01-19
**Outcome:** ✅ APPROVED (after fixes)

### Issues Found & Fixed

| Severity | Issue | Fix Applied |
|----------|-------|-------------|
| 🔴 HIGH | `formatRelativeDate()` crashes on null/invalid input | Added input validation with fallback strings |
| 🟡 MEDIUM | Code duplication undocumented | Added NOTE comments documenting intentional duplication |
| 🟡 MEDIUM | Missing edge case tests | Added 3 tests for null, invalid, and documentation |
| 🟡 MEDIUM | `code-card.njk` aria-label not explicitly escaped | Added `| e` filter for explicit escaping |

### Verification

- All 157 tests passing (3 new tests added)
- Build successful
- All ACs verified implemented
- All tasks verified complete

## Change Log

- 2026-01-19: Story created via create-story workflow
- 2026-01-19: Implementation completed - all tasks done, 154 tests passing
- 2026-01-19: Code review completed - 4 issues fixed, 157 tests passing, status → done
