# Story 3.7: Create Basic Brand Page Access

Status: done

## Story

As a **user (Lucas)**,
I want **to access a brand's codes directly via URL**,
So that **I can bookmark or share a link** (FR5).

## Acceptance Criteria

1. **Given** `src/brands/brand.njk` template exists, **When** Eleventy builds, **Then** it generates `/brands/[slug]/index.html` for each brand

2. **Given** I navigate to `/brands/nordvpn/`, **When** the page loads, **Then** I see all NordVPN codes with copy functionality

## Tasks / Subtasks

- [x] Task 1: Create brand page template (AC: #1)
  - [x] Create `src/brands/brand.njk` using Eleventy pagination
  - [x] Configure pagination to iterate over unique brands from codes.json
  - [x] Use permalink `/brands/{{ brand.slug }}/` for clean URLs
  - [x] Extend base.njk template for consistent layout

- [x] Task 2: Generate brand data for pagination (AC: #1)
  - [x] Create computed data or filter to extract unique brands from codes
  - [x] Include brand_slug, brand_name, and associated codes
  - [x] Sort brands alphabetically for consistency

- [x] Task 3: Implement brand page content (AC: #2)
  - [x] Display brand name as page heading
  - [x] Filter and display only codes for this specific brand
  - [x] Reuse CodeCard component structure from homepage
  - [x] Sort codes by found_at descending (most recent first)

- [x] Task 4: Enable copy functionality on brand pages (AC: #2)
  - [x] Ensure copy.js is loaded on brand pages (via base.njk)
  - [x] Verify copy button event delegation works with brand page DOM
  - [x] Test toast notification appears on brand pages

- [x] Task 5: Handle empty brand scenario (AC: #2)
  - [x] Show empathetic empty state if brand exists but has no codes
  - [x] Reuse empty state styling from Story 3.6
  - [x] Brand context should be included in message

- [x] Task 6: Add basic page metadata (AC: #1)
  - [x] Set page title to "Codes promo [Brand] - Crowd Codes"
  - [x] Set meta description mentioning brand name
  - [x] Note: Full SEO optimization is Story 4.1 scope

- [x] Task 7: Write automated tests (AC: #1, #2)
  - [x] Test brand.njk template exists
  - [x] Test pagination configuration is correct
  - [x] Test generated HTML includes brand-specific content
  - [x] Test copy functionality works on brand pages
  - [x] Test empty state displays when brand has no codes

- [x] Task 8: Verify build and test (AC: all)
  - [x] Run `npm run build` - brand pages generated
  - [x] Run `npm test` - all tests pass (279 tests)
  - [x] Manual test: Navigate to `/brands/testbrand/` (with test data)
  - [x] Manual test: Copy button works on brand page

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md` and `project-context.md`:

1. **File locations**:
   - CREATE: `src/brands/brand.njk` - Brand page template with pagination
   - MODIFY: `.eleventy.js` - Add brand collection/filter if needed
   - CREATE: `tests/brand-pages.test.js` - Tests for Story 3.7

2. **Naming conventions**:
   - CSS: kebab-case (existing classes reused)
   - JS: camelCase (existing functions reused)
   - URLs: `/brands/[slug]/` kebab-case slugs
   - Template: brand.njk (singular, per Eleventy convention)

3. **No bundler**: Plain Nunjucks templates, vanilla CSS

4. **No external dependencies**: Reuse existing copy.js and search.js infrastructure

### Eleventy Pagination Pattern

Per Eleventy documentation, the brand page template should use:

```nunjucks
---
pagination:
  data: codes.codes
  size: Infinity
  alias: brandCodes
  filter:
    - ""
  before: function(data, page) {
    // Group by brand_slug and return unique brands with their codes
  }
permalink: "brands/{{ brand.slug }}/"
---
```

**Alternative approach (simpler)**: Create a computed data file that extracts unique brands:

```javascript
// src/_data/brands.js
export default function(data) {
  const codes = data.codes?.codes || [];
  const brandMap = new Map();

  for (const code of codes) {
    if (!brandMap.has(code.brand_slug)) {
      brandMap.set(code.brand_slug, {
        slug: code.brand_slug,
        name: code.brand_name,
        codes: []
      });
    }
    brandMap.get(code.brand_slug).codes.push(code);
  }

  return Array.from(brandMap.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}
```

Then paginate over brands:

```nunjucks
---
pagination:
  data: brands
  size: 1
  alias: brand
permalink: "brands/{{ brand.slug }}/"
---
```

### Current Codebase State

**From Story 3.6 implementation:**
- `public/js/copy.js` - Handles copy functionality with event delegation on `#results`
- `public/js/search.js` - Has `renderResults()` function structure
- `public/css/components.css` - Has `.code-card`, `.empty-state` styles
- `src/_includes/base.njk` - Loads copy.js and search.js via script tags

**Key insight:** copy.js uses event delegation on `document` for `.copy-btn` clicks, so it will work on brand pages without modification.

**From search.js (line 187-199):**
```javascript
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
```

### Brand Page Template Structure

```nunjucks
---
pagination:
  data: brands
  size: 1
  alias: brand
permalink: "brands/{{ brand.slug }}/"
title: "Codes promo {{ brand.name }} - Crowd Codes"
description: "Codes promo {{ brand.name }} vérifiés et récents. Sans pubs, sans friction."
---
{% extends "base.njk" %}

{% block content %}
<h1>Codes promo {{ brand.name }}</h1>

<section id="results" class="results-container" aria-label="Codes promo {{ brand.name }}">
  {% if brand.codes.length > 0 %}
    {% for code in brand.codes | sort(true, false, 'found_at') | reverse %}
      <article class="code-card" data-code-id="{{ code.id }}" data-code-value="{{ code.code }}">
        <div class="code-card-main">
          <code class="code-value">{{ code.code }}</code>
          <button class="copy-btn" type="button" aria-label="Copier le code {{ code.code }}">Copier</button>
        </div>
        <div class="code-card-meta">
          <span class="code-brand">{{ code.brand_name }}</span>
          <span class="code-date">{{ code.found_at | formatRelativeDate }}</span>
          {% if code.source_channel %}
            <span class="code-source">{{ code.source_channel }}</span>
          {% endif %}
        </div>
      </article>
    {% endfor %}
  {% else %}
    <div class="empty-state" role="status">
      <p class="empty-state-title">Aucun code trouvé pour {{ brand.name }}</p>
      <p class="empty-state-message">Nous surveillons les influenceurs YouTube chaque jour.</p>
      <p class="empty-state-suggestion">Revenez bientôt pour découvrir de nouveaux codes.</p>
    </div>
  {% endif %}
</section>

<p><a href="/">← Retour à la recherche</a></p>
{% endblock %}
```

### Previous Story Learnings (Story 3.6)

**From Dev Agent Record:**
- 251 tests currently passing
- Empty state uses `role="status"` for non-intrusive announcement
- Error state uses `role="alert"` for assertive announcement
- French messaging: empathetic tone, explain why, suggest next steps
- XSS protection via Nunjucks auto-escaping (default behavior)

**Key patterns to follow:**
- Reuse `.empty-state`, `.empty-state-title`, `.empty-state-message`, `.empty-state-suggestion` classes
- Keep French localization consistent
- Use `role="status"` for empty states on brand pages

### Design Tokens Reference

```css
/* From tokens.css - already available */
:root {
  --color-text: #1a1a1a;
  --color-muted: #6b7280;
  --color-accent: #2563eb;
  --space-md: 16px;
  --space-lg: 24px;
}
```

### Testing Requirements

**Automated tests should verify:**
1. `src/brands/brand.njk` template exists
2. `.eleventy.js` or `src/_data/brands.js` provides brand data
3. Brand pages generate at `/brands/[slug]/index.html`
4. Each brand page contains the brand name in `<h1>`
5. CodeCard structure is present on brand pages
6. Copy button has correct `aria-label`
7. Empty state displays when brand has no codes
8. Back link to homepage exists

**Manual testing:**
- Add test codes to codes.json temporarily
- Navigate to `/brands/test-brand/`
- Verify codes display correctly
- Click copy button, verify toast appears
- Test on mobile viewport

### What NOT to Implement (Deferred)

Per Story 3.7 scope vs Epic 4:
- **NO SEO meta tags optimization** - Story 4.1 scope
- **NO JSON-LD schema markup** - Story 4.3 scope
- **NO sitemap entries** - Story 4.2 scope (already configured via plugin)
- **NO search on brand page** - Out of MVP scope
- **NO brand logo/image** - Out of MVP scope

### Edge Cases to Handle

1. **Brand with no codes**: Show empty state with brand context
2. **Brand slug with special characters**: Nunjucks auto-escapes, slugs are already kebab-case
3. **Empty codes.json**: No brand pages generated (pagination handles gracefully)
4. **Multiple codes same brand**: All codes shown, sorted by found_at

### Commit Message Template

```
feat: create basic brand page access (Story 3.7)

- Add src/brands/brand.njk with Eleventy pagination
- Add src/_data/brands.js for brand extraction
- Generate /brands/[slug]/ pages for each brand
- Reuse CodeCard structure and copy functionality
- Include empty state for brands with no codes
```

### References

- [Source: epics.md#Story-3.7] - Acceptance criteria
- [Source: prd.md#FR5] - Direct brand page access
- [Source: architecture.md#Frontend-Architecture] - Eleventy pagination
- [Source: ux-design-specification.md] - UX patterns
- [Eleventy Pagination Docs] - https://www.11ty.dev/docs/pagination/

### Project Structure Notes

**Files to create/modify:**
```
crowd-codes/
├── src/
│   ├── _data/
│   │   └── brands.js          # CREATE: Extract brands from codes.json
│   └── brands/
│       └── brand.njk          # CREATE: Brand page template
└── tests/
    └── brand-pages.test.js    # CREATE: Tests for Story 3.7
```

### Accessibility Checklist

- [x] Brand page uses semantic `<h1>` for brand name
- [x] Results container has `aria-label` with brand context
- [x] Copy buttons have descriptive `aria-label`
- [x] Empty state uses `role="status"` for polite announcement
- [x] Back link is keyboard accessible
- [x] Focus management: no focus traps

## Change Log

- 2026-01-19: Story created via create-story workflow
- 2026-01-19: Implementation complete - all 8 tasks done, 279 tests pass
- 2026-01-19: Code review fixes applied:
  - HIGH: Fixed sort order in brand.njk (removed redundant `| reverse`)
  - MEDIUM: Added JSON error logging in brands.js
  - MEDIUM: Added test cleanup (before/after hooks) in brand-pages.test.js
  - MEDIUM: Added test for invalid brand slug 404 behavior
  - Tests now: 280 passing
