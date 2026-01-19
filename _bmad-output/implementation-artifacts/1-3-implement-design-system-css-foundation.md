# Story 1.3: Implement Design System CSS Foundation

Status: done

## Story

As a **user**,
I want **a mobile-first, accessible design system**,
So that **the site is fast, readable, and works on all devices** (FR33, FR36).

## Acceptance Criteria

1. **Given** public/css/ folder exists, **When** I create the CSS files, **Then** the following structure exists: `tokens.css`, `reset.css`, `components.css`, `utilities.css`, `styles.css` (imports all)
2. **Given** tokens.css is created, **When** I inspect the CSS variables, **Then** it defines colors, spacing, typography, touch targets, and transitions per UX spec
3. **Given** the CSS is loaded, **When** I test color contrast, **Then** text (#1a1a1a) on background (#ffffff) exceeds 4.5:1 ratio (NFR-A1)
4. **Given** the CSS includes dark mode, **When** user prefers dark color scheme, **Then** colors invert appropriately via `@media (prefers-color-scheme: dark)`
5. **Given** the CSS includes motion preferences, **When** user prefers reduced motion, **Then** all transitions are disabled via `@media (prefers-reduced-motion: reduce)`
6. **Given** utilities.css exists, **When** I check for accessibility utilities, **Then** `.visually-hidden` class is defined for screen reader content

## Tasks / Subtasks

- [x] Task 1: Restructure CSS into modular files (AC: #1)
  - [x] Create `public/css/tokens.css` (design tokens only)
  - [x] Create `public/css/reset.css` (minimal CSS reset)
  - [x] Create `public/css/components.css` (component styles)
  - [x] Create `public/css/utilities.css` (helper classes)
  - [x] Update `public/css/styles.css` to import all files in order

- [x] Task 2: Implement design tokens (AC: #2)
  - [x] Define color tokens: `--color-bg`, `--color-text`, `--color-accent`, `--color-success`, `--color-muted`, `--color-border`
  - [x] Define spacing scale: `--space-xs` (4px) through `--space-xl` (32px)
  - [x] Define typography: `--font-sans`, `--font-mono`, font sizes
  - [x] Define touch target: `--touch-min: 44px`
  - [x] Define transitions: `--transition-fast`, `--transition-normal`

- [x] Task 3: Implement dark mode support (AC: #4)
  - [x] Add `@media (prefers-color-scheme: dark)` in tokens.css
  - [x] Define inverted color values for dark mode
  - [x] Test dark mode rendering

- [x] Task 4: Implement reduced motion support (AC: #5)
  - [x] Add `@media (prefers-reduced-motion: reduce)` in utilities.css
  - [x] Disable all transitions and animations

- [x] Task 5: Implement utility classes (AC: #6)
  - [x] Move `.visually-hidden` to utilities.css
  - [x] Add `.visually-hidden:focus` styles for skip link
  - [x] Add any other helper classes needed

- [x] Task 6: Update component styles (AC: #1)
  - [x] Move layout styles to components.css
  - [x] Update all styles to use design tokens (var())
  - [x] Ensure consistent use of spacing scale

- [x] Task 7: Verify build and test (AC: #3)
  - [x] Run `npm run build`
  - [x] Verify styles load correctly
  - [x] Test contrast ratio compliance
  - [x] Test dark mode in browser
  - [x] Test reduced motion preference

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md`:

1. **No CSS framework**: Vanilla CSS only
2. **No build step**: No preprocessors, no Tailwind
3. **File naming**: kebab-case (e.g., `tokens.css`)
4. **Single import**: `styles.css` imports all partials

### UX Design Requirements

Per `ux-design-specification.md`:

**Design Tokens:**
```css
:root {
  /* Colors - High contrast for trust */
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-accent: #2563eb;       /* Blue - action */
  --color-success: #16a34a;      /* Green - copied */
  --color-muted: #6b7280;        /* Gray - metadata */
  --color-border: #e5e7eb;       /* Light gray - separators */

  /* Spacing - 4px base scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, monospace;  /* For codes */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;

  /* Touch targets */
  --touch-min: 44px;  /* Apple HIG minimum */

  /* Transitions */
  --transition-fast: 100ms ease-out;
  --transition-normal: 200ms ease-out;
}
```

**Dark Mode Colors:**
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1a1a1a;
    --color-text: #ffffff;
    --color-border: #374151;
    --color-muted: #9ca3af;
  }
}
```

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

### CSS Organization

**Import Order (styles.css):**
```css
@import 'tokens.css';
@import 'reset.css';
@import 'utilities.css';
@import 'components.css';
```

**tokens.css** - Only CSS custom properties (design tokens)
**reset.css** - Minimal CSS reset, box-sizing, body defaults
**utilities.css** - Helper classes (.visually-hidden, etc.)
**components.css** - Layout and component styles

### Contrast Compliance (NFR-A1)

| Combination | Ratio | Status |
|-------------|-------|--------|
| #1a1a1a on #ffffff | 16:1 | ✅ WCAG AAA |
| #ffffff on #2563eb | 4.6:1 | ✅ WCAG AA |
| #6b7280 on #ffffff | 4.6:1 | ✅ WCAG AA |

### Testing Requirements

- Verify `npm run build` completes without errors
- Verify CSS imports work (check browser DevTools)
- Test dark mode: Chrome DevTools → Rendering → Emulate CSS media feature
- Test reduced motion: Chrome DevTools → Rendering → Emulate CSS media feature
- Verify contrast with browser extension or online tool

### References

- [Source: architecture.md#Frontend-Architecture] - Vanilla CSS decision
- [Source: ux-design-specification.md#Design-System-Foundation] - Design tokens
- [Source: ux-design-specification.md#Visual-Design-Foundation] - Color system
- [Source: ux-design-specification.md#Responsive-Design-&-Accessibility] - Media queries
- [Source: prd.md#NFR-A1] - Color contrast ratio requirement

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build verified: All CSS files copied to `_site/css/`
- Fixed Eleventy passthrough copy config to map `public/` → `/` (not `public/`)

### Completion Notes List

- ✅ tokens.css created with all design tokens (colors, spacing, typography, touch, transitions)
- ✅ reset.css created with minimal CSS reset
- ✅ utilities.css created with .visually-hidden, reduced motion, focus-visible
- ✅ components.css created with layout styles using design tokens
- ✅ styles.css updated to import all modules in correct order
- ✅ Dark mode support via `@media (prefers-color-scheme: dark)`
- ✅ Reduced motion support via `@media (prefers-reduced-motion: reduce)`
- ✅ .eleventy.js updated: passthrough copy fixed for correct URL paths
- ✅ Build verified - all 6 acceptance criteria met

### File List

**New files:**
- public/css/tokens.css
- public/css/reset.css
- public/css/utilities.css
- public/css/components.css

**Modified files:**
- public/css/styles.css (now imports all modules)
- .eleventy.js (fixed passthrough copy path)

**Generated (not committed):**
- _site/css/tokens.css
- _site/css/reset.css
- _site/css/utilities.css
- _site/css/components.css
- _site/css/styles.css

## Senior Developer Review (AI)

**Review Date:** 2026-01-19
**Review Outcome:** Approved with fixes applied
**Reviewer:** Claude Opus 4.5

### Summary

All 6 Acceptance Criteria validated after fixes. Code review found 1 CRITICAL, 3 MEDIUM, and 3 LOW issues. CRITICAL and MEDIUM issues fixed to match UX spec exactly.

### Issues Found & Resolved

| Severity | Issue | Resolution |
|----------|-------|------------|
| CRITICAL | Dark mode `--color-text: #f5f5f5` deviated from spec | ✅ Fixed: Changed to `#ffffff` per spec |
| MEDIUM | Unauthorized `--color-accent` in dark mode | ✅ Fixed: Removed (spec doesn't define it) |
| MEDIUM | Unauthorized `--color-success` in dark mode | ✅ Fixed: Removed (spec doesn't define it) |
| MEDIUM | Reduced motion used `0.01ms` instead of `none` | ✅ Fixed: Matched spec exactly |
| LOW | Extended font stacks beyond spec | Kept as pragmatic enhancement |
| LOW | Additional tokens (font-weight, line-height, etc.) | Kept as useful extensions |
| LOW | Missing `--font-size-2xl` | N/A - not needed currently |

### Action Items

- [x] [AI-Review][CRITICAL] Match dark mode --color-text to spec [tokens.css:53]
- [x] [AI-Review][MEDIUM] Remove unauthorized dark mode accent [tokens.css:54]
- [x] [AI-Review][MEDIUM] Remove unauthorized dark mode success [tokens.css:55]
- [x] [AI-Review][MEDIUM] Match reduced motion to spec [utilities.css:36-44]

## Change Log

- **2026-01-19**: Story created (SM Agent)
- **2026-01-19**: Implementation completed (Dev Agent)
- **2026-01-19**: Code review fixes applied - strict UX spec compliance (Review Agent)
