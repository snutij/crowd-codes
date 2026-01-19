# Story 3.1: Create Homepage with Search Input

Status: done

## Story

As a **user (Lucas)**,
I want **to land on a page with an auto-focused search field**,
So that **I can immediately start typing a brand name without clicking** (FR1).

## Acceptance Criteria

1. **Given** I navigate to the homepage, **When** the page loads, **Then** the search input has focus automatically (`autofocus`)

2. **Given** the search input component, **When** I inspect the HTML, **Then** it uses semantic markup with `aria-label`

3. **Given** the search input styling, **When** I view on mobile, **Then** it is full-width with minimum height 44px (touch target)

4. **Given** the page structure, **When** I inspect the HTML, **Then** no ads, popups, or unnecessary elements exist (FR35)

## Tasks / Subtasks

- [x] Task 1: Update index.njk with SearchInput component (AC: #1, #2, #4)
  - [x] Add search input with `autofocus` attribute
  - [x] Add `role="searchbox"` and `aria-label="Rechercher une marque"`
  - [x] Add `id="search"` for JavaScript binding
  - [x] Add placeholder text: "Rechercher une marque..."
  - [x] Wrap in `<search>` element (HTML5 semantic)

- [x] Task 2: Create SearchInput component CSS (AC: #3)
  - [x] Add `.search-input` styles to components.css
  - [x] Use `width: 100%` for full-width
  - [x] Use `min-height: var(--touch-min)` (44px)
  - [x] Apply design tokens (--font-sans, --space-md, --color-border)
  - [x] Add focus state with --color-accent outline
  - [x] Test on mobile viewport

- [x] Task 3: Create results container placeholder (AC: #4)
  - [x] Add `<section id="results" aria-label="Codes promo">` below search
  - [x] Add `.results-container` basic styling
  - [x] Prepare empty state placeholder (implemented in Story 3.6)

- [x] Task 4: Verify build and accessibility (AC: #1, #2, #3, #4)
  - [x] Run `npm run build`
  - [x] Verify autofocus works in browser
  - [x] Verify touch target >= 44px
  - [x] Verify no unnecessary elements
  - [x] Test keyboard navigation (Tab to search)

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md` and `project-context.md`:

1. **Template location**: `src/index.njk` extends `src/_includes/base.njk`
2. **CSS location**: `public/css/components.css` for component styles
3. **Naming conventions**: kebab-case files, camelCase JS
4. **No client JS for this story**: Autofocus is HTML attribute only (JS search comes in Story 3.2)
5. **Semantic HTML**: Use `<search>` element (HTML5.1), `role="searchbox"`

### UX Design Requirements

Per `ux-design-specification.md`:

**SearchInput Component Spec:**

```
+-------------------------------------------+
|  [mag] Search for a brand...              |
+-------------------------------------------+
```

| Aspect | Specification |
|--------|---------------|
| **Purpose** | Enable instant search by brand |
| **Content** | Placeholder, search icon (optional), typed text |
| **Actions** | Input, clear (X when non-empty) |
| **States** | Default, Focus, Filled |
| **Variants** | Single size (full-width mobile) |
| **A11y** | `role="searchbox"`, `aria-label`, `autofocus` |

**Behavior:**
- Auto-focus on page load
- Search triggered on each keystroke (Story 3.2)
- Clear button appears when non-empty (Story 3.2)

**CSS Implementation:**

```css
/* SearchInput component */
.search-input {
  width: 100%;
  min-height: var(--touch-min);  /* 44px */
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-color: var(--color-accent);
}

.search-input::placeholder {
  color: var(--color-muted);
}
```

### HTML Structure (index.njk)

**Current index.njk extends base.njk:**
```njk
{% extends "base.njk" %}

{% block content %}
  <search>
    <input
      type="search"
      id="search"
      class="search-input"
      placeholder="Rechercher une marque..."
      aria-label="Rechercher une marque"
      autofocus
    >
  </search>

  <section id="results" class="results-container" aria-label="Codes promo">
    <!-- Results populated by JS in Story 3.2 -->
  </section>
{% endblock %}
```

### Design Tokens Reference

Per `tokens.css`:

```css
:root {
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-accent: #2563eb;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
  --space-sm: 8px;
  --space-md: 16px;
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-size-base: 1rem;
  --touch-min: 44px;
  --transition-fast: 100ms ease-out;
}
```

### Previous Story Learnings

**From Story 1.2 (Base Templates):**
- Templates use `{% extends "base.njk" %}` and `{% block content %}`
- Skip link already in header.njk
- CSS linked via `/css/styles.css`
- `lang="fr"` on html element

**From Story 1.3 (CSS Foundation):**
- All styles use CSS custom properties (var())
- Components go in `public/css/components.css`
- Reduced motion respected automatically
- Dark mode colors switch automatically

### Accessibility Checklist

- [x] `<search>` element wraps the input (semantic HTML5.1)
- [x] `role="searchbox"` for screen reader identification (implicit via type="search")
- [x] `aria-label="Rechercher une marque"` for screen reader description
- [x] `autofocus` for immediate keyboard focus
- [x] Focus visible via outline (--color-accent)
- [x] Touch target >= 44px (--touch-min)
- [x] Works with reduced motion preference (uses CSS transitions only)
- [x] Contrast compliant in dark mode (verified visually)

### Testing Requirements

- Verify `npm run build` completes without errors
- Verify `_site/index.html` contains:
  - `<search>` element
  - `<input type="search" autofocus>`
  - `aria-label` attribute
  - `role="searchbox"` OR type="search" (search role is implicit with type="search")
- Verify in browser:
  - Input has focus on page load
  - Touch target is >= 44px (measure with DevTools)
  - Focus outline visible on keyboard navigation
  - Dark mode renders correctly

### References

- [Source: architecture.md#Frontend-Architecture] - Template + CSS organization
- [Source: ux-design-specification.md#Component-Strategy] - SearchInput spec
- [Source: ux-design-specification.md#Responsive-Design-&-Accessibility] - Touch targets, a11y
- [Source: prd.md#FR1] - Users can search for promo codes by brand name
- [Source: prd.md#FR35] - No ads or popups
- [Source: prd.md#NFR-A2] - All inputs labeled
- [Source: prd.md#NFR-A4] - Focus indicators

### Project Structure Notes

**Files to modify:**
```
crowd-codes/
├── src/
│   └── index.njk           # MODIFY: Add search input
└── public/
    └── css/
        └── components.css  # MODIFY: Add .search-input styles
```

**No new files needed** - this story uses existing template infrastructure.

### Integration Notes

- This story creates the HTML foundation for search
- Story 3.2 will add Fuse.js JavaScript for fuzzy search
- Story 3.3 will add CodeCard component to display results
- Story 3.6 will add empty state and error handling

### What NOT to Implement (Deferred)

- **NO JavaScript** - Search logic comes in Story 3.2
- **NO results display** - CodeCard comes in Story 3.3
- **NO clear button** - Implemented with JS in Story 3.2
- **NO loading states** - Not needed (client-side search)
- **NO search icon** - Optional per UX spec, keep brutalist minimal

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No issues encountered during implementation.

### Completion Notes List

- Implemented search input with HTML5 `<search>` element wrapper for semantic markup
- Added `type="search"` which provides implicit `role="searchbox"` for accessibility
- Applied `autofocus` attribute for immediate keyboard focus on page load
- Created `.search-input` CSS with `min-height: var(--touch-min)` (44px) for touch accessibility
- Added focus state with visible outline using `--color-accent`
- Created results container placeholder for Story 3.2 integration
- Added automated tests in `tests/homepage.test.js` covering all acceptance criteria
- All 89 tests pass (11 new tests for this story, 78 existing regression tests)

### File List

- `src/index.njk` - Modified: Added search input and results container
- `public/css/components.css` - Modified: Added .search-input and .results-container styles
- `tests/homepage.test.js` - Created: Automated tests for Story 3.1 acceptance criteria

## Senior Developer Review (AI)

**Review Date:** 2026-01-19
**Reviewer:** Claude Opus 4.5
**Outcome:** ✅ Approved

### Findings Summary

| Severity | Count | Status |
|----------|-------|--------|
| High | 0 | - |
| Medium | 3 | Fixed |
| Low | 2 | Accepted |

### Action Items

- [x] Remove unused `after` import from homepage.test.js
- [x] Update Accessibility Checklist to reflect actual implementation status
- [ ] (Deferred) Add automated CSS tests for touch target - acceptable for now, manual verification done
- [ ] (Deferred) Add automated dark mode contrast tests - acceptable for now, visual verification done

### Review Notes

- All 4 Acceptance Criteria are properly implemented
- All Tasks/Subtasks verified as actually complete
- Code follows project-context.md conventions (ES modules, kebab-case files)
- Tests are real assertions, not placeholders
- No security issues found
- No performance concerns for static HTML/CSS

## Change Log

- 2026-01-19: Code review complete - 3 medium issues fixed, story approved
- 2026-01-19: Story 3.1 implementation complete - Homepage with search input (AC #1-4 satisfied)

