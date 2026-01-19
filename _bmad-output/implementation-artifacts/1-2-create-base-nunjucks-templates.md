# Story 1.2: Create Base Nunjucks Templates

Status: done

## Story

As a **developer**,
I want **base Nunjucks templates with semantic HTML structure**,
So that **all pages have consistent markup, meta tags, and accessibility foundations**.

## Acceptance Criteria

1. **Given** the src/_includes/ folder exists, **When** I create the base templates, **Then** the following files exist: `base.njk`, `head.njk`, `header.njk`, `footer.njk`
2. **Given** base.njk is rendered, **When** I inspect the HTML output, **Then** it includes `<!DOCTYPE html>` and `<html lang="fr">`
3. **Given** base.njk is rendered, **When** I inspect the head, **Then** it includes a Content-Security-Policy meta tag restricting external scripts (NFR-S3)
4. **Given** base.njk is rendered, **When** I inspect the head, **Then** it includes viewport meta for mobile (NFR-P2)
5. **Given** the templates are created, **When** I update src/index.njk to extend base.njk, **Then** the page renders with header, main content area, and footer
6. **Given** the HTML output, **When** I validate semantics, **Then** it uses `<main>`, `<header>`, `<footer>` correctly

## Tasks / Subtasks

- [x] Task 1: Create base.njk template (AC: #1, #2)
  - [x] Create `src/_includes/base.njk`
  - [x] Add HTML5 doctype and `<html lang="fr">`
  - [x] Include head.njk partial
  - [x] Add semantic structure: header, main, footer partials
  - [x] Define content blocks for child templates

- [x] Task 2: Create head.njk partial (AC: #3, #4)
  - [x] Create `src/_includes/head.njk`
  - [x] Add `<meta charset="UTF-8">`
  - [x] Add viewport meta: `width=device-width, initial-scale=1.0`
  - [x] Add Content-Security-Policy meta tag (restrict external scripts)
  - [x] Add title block with default value
  - [x] Add meta description block
  - [x] Add Open Graph meta tags
  - [x] Link to CSS stylesheet

- [x] Task 3: Create header.njk partial (AC: #5, #6)
  - [x] Create `src/_includes/header.njk`
  - [x] Add `<header>` with site title/logo
  - [x] Add skip link for accessibility
  - [x] Keep minimal per brutalist design

- [x] Task 4: Create footer.njk partial (AC: #5, #6)
  - [x] Create `src/_includes/footer.njk`
  - [x] Add `<footer>` with minimal content
  - [x] Include link to /stats page (public transparency)
  - [x] Include "Open Source" link to GitHub

- [x] Task 5: Update index.njk to extend base.njk (AC: #5)
  - [x] Modify `src/index.njk` to extend base.njk
  - [x] Move content into appropriate blocks
  - [x] Verify build generates correct HTML structure

- [x] Task 6: Verify build and validate HTML (AC: #2, #6)
  - [x] Run `npm run build`
  - [x] Inspect generated `_site/index.html`
  - [x] Validate semantic HTML structure
  - [x] Verify CSP meta tag is present

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md`, the following MUST be followed:

1. **Template location**: All shared templates in `src/_includes/`
2. **Config reference**: `.eleventy.js` sets includes to `_includes`
3. **Nunjucks syntax**: Use `{% extends %}`, `{% block %}`, `{% include %}`
4. **Naming conventions**: kebab-case for files (e.g., `base.njk`)

### UX Design Requirements

Per `ux-design-specification.md`:

1. **Language**: `lang="fr"` (French)
2. **Brutalist minimal**: No decorative elements
3. **System fonts**: `system-ui, -apple-system, sans-serif`
4. **Accessibility**: Skip link, semantic HTML, ARIA where needed

### Content Security Policy

Per NFR-S3, restrict external scripts. Recommended CSP:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'">
```

This CSP:
- Allows scripts only from same origin
- Allows inline styles (needed for minimal CSS adjustments)
- Blocks all external resources
- Allows data URIs for images (optional)

### Template Structure

**base.njk:**
```njk
<!DOCTYPE html>
<html lang="fr">
<head>
  {% include "head.njk" %}
</head>
<body>
  {% include "header.njk" %}
  <main id="main-content">
    {% block content %}{% endblock %}
  </main>
  {% include "footer.njk" %}
</body>
</html>
```

**head.njk:**
```njk
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'">
<meta name="description" content="{{ description | default('Codes promo sans friction. Visibles immédiatement, triés par fraîcheur.') }}">

<meta property="og:title" content="{{ title | default('Crowd Codes') }}">
<meta property="og:description" content="{{ description | default('Codes promo sans friction.') }}">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">

<title>{{ title | default('Crowd Codes') }}</title>

<link rel="stylesheet" href="/css/styles.css">
```

**header.njk:**
```njk
<a href="#main-content" class="visually-hidden">Aller au contenu</a>
<header>
  <a href="/" class="site-title">Crowd Codes</a>
</header>
```

**footer.njk:**
```njk
<footer>
  <nav aria-label="Footer">
    <a href="/stats/">Stats</a>
    <a href="https://github.com/justinMusic/crowd-codes" rel="noopener">GitHub</a>
  </nav>
</footer>
```

### CSS Placeholder

Create minimal `public/css/styles.css` if not exists (will be expanded in Story 1.3):

```css
/* Minimal reset and .visually-hidden for Story 1.2 */
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Testing Requirements

- Verify `npm run build` completes without errors
- Verify `_site/index.html` contains:
  - `<!DOCTYPE html>`
  - `<html lang="fr">`
  - CSP meta tag
  - Viewport meta tag
  - `<header>`, `<main>`, `<footer>` elements
  - Skip link with `.visually-hidden` class

### References

- [Source: architecture.md#Project-Structure-&-Boundaries] - Template location
- [Source: architecture.md#Implementation-Patterns-&-Consistency-Rules] - Naming conventions
- [Source: ux-design-specification.md#Visual-Design-Foundation] - Typography, colors
- [Source: ux-design-specification.md#Responsive-Design-&-Accessibility] - Skip link, semantic HTML
- [Source: prd.md#NFR-S3] - Content Security Policy requirement
- [Source: prd.md#NFR-P2] - Viewport meta requirement

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build verified: `_site/index.html` generated successfully with all required elements

### Completion Notes List

- ✅ base.njk created with HTML5 doctype, lang="fr", semantic structure
- ✅ head.njk created with CSP, viewport, meta description, Open Graph tags
- ✅ header.njk created with skip link for accessibility
- ✅ footer.njk created with links to /stats/ and GitHub
- ✅ styles.css created with minimal reset and .visually-hidden class
- ✅ index.njk updated to extend base.njk using {% extends %} and {% block %}
- ✅ Build verified - all 6 acceptance criteria validated

### File List

**New files:**
- src/_includes/base.njk
- src/_includes/head.njk
- src/_includes/header.njk
- src/_includes/footer.njk
- public/css/styles.css

**Modified files:**
- src/index.njk (refactored to extend base.njk)

**Generated (not committed):**
- _site/index.html
- _site/css/styles.css

## Senior Developer Review (AI)

**Review Date:** 2026-01-19
**Review Outcome:** Approved with fixes applied
**Reviewer:** Claude Opus 4.5

### Summary

All 6 Acceptance Criteria validated. Implementation matches story requirements. Code review found 1 CRITICAL, 4 MEDIUM, and 4 LOW issues - CRITICAL and MEDIUM issues fixed automatically.

### Issues Found & Resolved

| Severity | Issue | Resolution |
|----------|-------|------------|
| CRITICAL | Missing `rel="noreferrer"` on external link | ✅ Fixed: Added `rel="noopener noreferrer"` |
| MEDIUM | Missing `target="_blank"` on GitHub link | ✅ Fixed: Opens in new tab |
| MEDIUM | Missing `role="banner"` on header | ✅ Fixed: Added role attribute |
| MEDIUM | aria-label in English instead of French | ✅ Fixed: "Navigation du pied de page" |
| MEDIUM | CSS hardcoded colors instead of tokens | ✅ Fixed: Added :root design tokens |
| LOW | OG description default truncated | ✅ Fixed: Aligned with meta description |
| LOW | Title mixes languages | Deferred to later story |
| LOW | Missing og:url and og:image | Deferred to Epic 4 (SEO) |
| LOW | Skip link lang attribute | Not needed (page has lang="fr") |

### Action Items

- [x] [AI-Review][CRITICAL] Add noreferrer to external links [footer.njk:4]
- [x] [AI-Review][MEDIUM] Add target="_blank" to external links [footer.njk:4]
- [x] [AI-Review][MEDIUM] Add role="banner" to header [header.njk:2]
- [x] [AI-Review][MEDIUM] Translate aria-label to French [footer.njk:2]
- [x] [AI-Review][MEDIUM] Use CSS custom properties [styles.css:5-12]
- [x] [AI-Review][LOW] Align OG description default [head.njk:7]

## Change Log

- **2026-01-19**: Story created (SM Agent)
- **2026-01-19**: Implementation completed (Dev Agent)
- **2026-01-19**: Code review fixes applied - security, accessibility, i18n, design tokens (Review Agent)
