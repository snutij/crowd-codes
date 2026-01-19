# Story 4.1: Enhance Brand Pages with SEO Meta Tags

Status: ready-for-dev

## Story

As a **search engine**,
I want **optimized meta tags on each brand page**,
So that **crowd-codes ranks for "promo code [brand]" searches** (FR29, FR32).

## Acceptance Criteria

1. **Given** `src/brands/brand.njk` template, **When** Eleventy generates a brand page, **Then** each page has unique, SEO-optimized title and description meta tags

2. **Given** the brand page, **When** I check the Open Graph tags, **Then** og:title, og:description, og:type, og:url are present

3. **Given** the brand page, **When** I check canonical URL, **Then** it includes `<link rel="canonical">`

## Tasks / Subtasks

- [ ] Task 1: Enhance title and description meta tags (AC: #1)
  - [ ] Update `eleventyComputed` title format to "Code promo [Brand] | [Month Year] - Crowd Codes"
  - [ ] Update description to include code count and freshness: "X codes promo [Brand] vérifiés en [Month Year]. Copiez-les en un clic."
  - [ ] Ensure meta description length is 150-160 characters (SEO best practice)

- [ ] Task 2: Add Open Graph meta tags (AC: #2)
  - [ ] Add og:title matching page title
  - [ ] Add og:description matching meta description
  - [ ] Add og:type="website"
  - [ ] Add og:url with full canonical URL (using site hostname from .eleventy.js)
  - [ ] Add og:site_name="Crowd Codes"
  - [ ] Add og:locale="fr_FR"

- [ ] Task 3: Add canonical URL (AC: #3)
  - [ ] Add `<link rel="canonical">` in head section
  - [ ] Use SITE_HOSTNAME env variable (already configured in .eleventy.js)
  - [ ] Ensure URL matches og:url

- [ ] Task 4: Add Twitter Card meta tags (AC: #2)
  - [ ] Add twitter:card="summary"
  - [ ] Add twitter:title matching og:title
  - [ ] Add twitter:description matching og:description

- [ ] Task 5: Update head.njk or base.njk for SEO blocks (AC: all)
  - [ ] Create SEO block in base.njk that brand pages can extend
  - [ ] Ensure default meta tags exist for pages without custom SEO
  - [ ] Consider creating `_includes/seo-meta.njk` partial for reusability

- [ ] Task 6: Write automated tests (AC: #1, #2, #3)
  - [ ] Test generated brand page has correct title format
  - [ ] Test meta description exists and has correct length
  - [ ] Test Open Graph tags are present (og:title, og:description, og:type, og:url)
  - [ ] Test canonical URL is present and correctly formatted
  - [ ] Test Twitter card tags are present

- [ ] Task 7: Verify build and test (AC: all)
  - [ ] Run `npm run build` - brand pages generated with SEO tags
  - [ ] Run `npm test` - all tests pass
  - [ ] Manual test: Inspect HTML source of a brand page
  - [ ] Manual test: Validate with Facebook Sharing Debugger (optional)

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md` and `project-context.md`:

1. **File locations**:
   - MODIFY: `src/brands/brand.njk` - Add SEO meta tags
   - MODIFY: `src/_includes/base.njk` - Add SEO blocks if needed
   - CREATE: `src/_includes/seo-meta.njk` - Reusable SEO partial (optional)
   - CREATE: `tests/seo-meta.test.js` - Tests for Story 4.1

2. **Naming conventions**:
   - CSS: kebab-case (no CSS changes expected)
   - Templates: kebab-case filenames
   - Meta tags: standard HTML attribute naming

3. **No bundler**: Plain Nunjucks templates, vanilla CSS

4. **Environment variables**: Use `SITE_HOSTNAME` from `.eleventy.js` (already configured)

### Current Codebase State

**From Story 3.7 implementation:**
- `src/brands/brand.njk` already has basic title and description via `eleventyComputed`
- `.eleventy.js` already has sitemap plugin with `SITE_HOSTNAME` configuration
- `src/_includes/base.njk` has basic HTML structure

**Current brand.njk frontmatter:**
```nunjucks
---
pagination:
  data: brands
  size: 1
  alias: brand
permalink: "brands/{{ brand.slug }}/"
eleventyComputed:
  title: "Codes promo {{ brand.name }} - Crowd Codes"
  description: "Codes promo {{ brand.name }} vérifiés et récents. Sans pubs, sans friction."
---
```

### SEO Best Practices to Follow

1. **Title tag** (50-60 chars ideal):
   - Include brand name prominently
   - Include primary keyword "code promo"
   - Include site name at end
   - Example: `Code promo NordVPN | Janvier 2026 - Crowd Codes`

2. **Meta description** (150-160 chars):
   - Include code count for social proof
   - Include freshness indicator (month/year)
   - Include call-to-action
   - Example: `3 codes promo NordVPN vérifiés en janvier 2026. Copiez-les en un clic, sans inscription ni pubs.`

3. **Open Graph tags**:
   - Required: og:title, og:description, og:type, og:url
   - Recommended: og:site_name, og:locale

4. **Canonical URL**:
   - Must match og:url exactly
   - Use absolute URL with HTTPS

### Implementation Approach

**Option 1 (Recommended): Extend brand.njk frontmatter**

Add computed data for SEO fields:

```nunjucks
---
pagination:
  data: brands
  size: 1
  alias: brand
permalink: "brands/{{ brand.slug }}/"
eleventyComputed:
  title: "Code promo {{ brand.name }} | {{ page.date | date: '%B %Y' }} - Crowd Codes"
  description: "{{ brand.codes.length }} codes promo {{ brand.name }} vérifiés. Copiez-les en un clic, sans inscription."
  canonicalUrl: "{{ site.hostname }}/brands/{{ brand.slug }}/"
---
```

Then add meta tags in head block:

```nunjucks
{% block head %}
  <meta name="description" content="{{ description }}">
  <link rel="canonical" href="{{ canonicalUrl }}">
  <meta property="og:title" content="{{ title }}">
  <meta property="og:description" content="{{ description }}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{{ canonicalUrl }}">
  <meta property="og:site_name" content="Crowd Codes">
  <meta property="og:locale" content="fr_FR">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{{ title }}">
  <meta name="twitter:description" content="{{ description }}">
{% endblock %}
```

**Option 2: Create seo-meta.njk partial**

For maximum reusability across homepage and stats page:

```nunjucks
{# src/_includes/seo-meta.njk #}
<meta name="description" content="{{ seoDescription or description }}">
<link rel="canonical" href="{{ canonicalUrl }}">
<meta property="og:title" content="{{ seoTitle or title }}">
...
```

### Testing Strategy

**Build-time tests (brand-seo.test.js):**

```javascript
describe('Brand Page SEO (Story 4.1)', () => {
  test('brand page has SEO-optimized title', () => {
    const content = readFileSync(brandPagePath, 'utf-8');
    assert.match(content, /<title>Code promo .+ \| .+ - Crowd Codes<\/title>/);
  });

  test('brand page has meta description with correct length', () => {
    const content = readFileSync(brandPagePath, 'utf-8');
    const descMatch = content.match(/<meta name="description" content="([^"]+)"/);
    assert.ok(descMatch);
    assert.ok(descMatch[1].length >= 100 && descMatch[1].length <= 160);
  });

  test('brand page has Open Graph tags', () => {
    const content = readFileSync(brandPagePath, 'utf-8');
    assert.match(content, /<meta property="og:title"/);
    assert.match(content, /<meta property="og:description"/);
    assert.match(content, /<meta property="og:type" content="website"/);
    assert.match(content, /<meta property="og:url"/);
  });

  test('brand page has canonical URL', () => {
    const content = readFileSync(brandPagePath, 'utf-8');
    assert.match(content, /<link rel="canonical" href="https:\/\//);
  });
});
```

### What NOT to Implement (Deferred)

Per Story 4.1 scope vs other stories:
- **NO JSON-LD schema markup** - Story 4.3 scope
- **NO sitemap changes** - Story 4.2 scope (already working via plugin)
- **NO homepage SEO** - Out of Epic 4 scope (homepage has different needs)
- **NO brand logo/image in OG tags** - Out of MVP scope

### Edge Cases to Handle

1. **Brand with 0 codes**: Description should gracefully handle zero ("Aucun code promo [Brand]...")
2. **Very long brand name**: Title may exceed 60 chars - truncate if needed
3. **Special characters in brand name**: Ensure proper HTML escaping in meta tags
4. **Missing SITE_HOSTNAME env**: Default to `https://crowd-codes.pages.dev`

### Commit Message Template

```
feat: enhance brand pages with SEO meta tags (Story 4.1)

- Add SEO-optimized title format with date
- Add Open Graph meta tags (og:title, og:description, og:type, og:url)
- Add canonical URL link
- Add Twitter card meta tags
- Include code count in meta description for social proof
```

### References

- [Source: epics.md#Story-4.1] - Acceptance criteria
- [Source: prd.md#FR29, FR32] - SEO requirements
- [Source: architecture.md#Frontend-Architecture] - Eleventy patterns
- [Open Graph Protocol] - https://ogp.me/
- [Google SEO Guidelines] - https://developers.google.com/search/docs/fundamentals/seo-starter-guide

### Project Structure Notes

**Files to create/modify:**
```
crowd-codes/
├── src/
│   ├── _includes/
│   │   └── base.njk          # MODIFY: Add SEO block if needed
│   └── brands/
│       └── brand.njk          # MODIFY: Add SEO meta tags
└── tests/
    └── brand-seo.test.js      # CREATE: Tests for Story 4.1
```

### Accessibility Checklist

- [x] No accessibility changes required (meta tags don't affect a11y)
- [x] Existing content remains accessible

## Change Log

- 2026-01-19: Story created via create-story workflow
