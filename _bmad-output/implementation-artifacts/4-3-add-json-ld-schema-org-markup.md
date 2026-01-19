# Story 4.3: Add JSON-LD Schema.org Markup

Status: ready-for-dev

## Story

As a **search engine**,
I want **structured data for rich snippets**,
So that **Google can display enhanced results with code info** (FR31).

## Acceptance Criteria

1. **Given** the brand page template, **When** I inspect the HTML head, **Then** it includes valid JSON-LD script with schema.org markup

2. **Given** the homepage, **When** I check JSON-LD, **Then** it includes WebSite schema with SearchAction

## Tasks / Subtasks

- [ ] Task 1: Add JSON-LD to brand pages (AC: #1)
  - [ ] Create JSON-LD script block in brand.njk head
  - [ ] Use appropriate schema type (e.g., `ItemList` or `Product` for codes)
  - [ ] Include brand name, code count, and page URL
  - [ ] Ensure JSON is valid and properly escaped

- [ ] Task 2: Add WebSite schema to homepage (AC: #2)
  - [ ] Add JSON-LD script block in index.njk head
  - [ ] Use `WebSite` schema type
  - [ ] Include `potentialAction` with `SearchAction` for site search
  - [ ] Configure search URL template with `{search_term_string}` placeholder

- [ ] Task 3: Create JSON-LD partial for reusability (AC: #1, #2)
  - [ ] Create `src/_includes/json-ld.njk` partial
  - [ ] Accept schema data as parameter
  - [ ] Handle JSON escaping properly for Nunjucks

- [ ] Task 4: Add Organization schema (AC: #1, #2)
  - [ ] Include basic Organization schema on all pages
  - [ ] Set name, url, and description
  - [ ] Add to base.njk or as separate partial

- [ ] Task 5: Validate JSON-LD output (AC: #1, #2)
  - [ ] Test with Google Rich Results Test tool
  - [ ] Test with Schema.org validator
  - [ ] Ensure no errors or warnings

- [ ] Task 6: Write automated tests (AC: #1, #2)
  - [ ] Test brand page has JSON-LD script tag
  - [ ] Test JSON-LD is valid JSON
  - [ ] Test brand page JSON-LD contains brand name
  - [ ] Test homepage has WebSite schema
  - [ ] Test homepage has SearchAction

- [ ] Task 7: Verify build and test (AC: all)
  - [ ] Run `npm run build` - pages generated with JSON-LD
  - [ ] Run `npm test` - all tests pass
  - [ ] Manual test: Validate with Google Rich Results Test
  - [ ] Manual test: Inspect JSON-LD in browser DevTools

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md` and `project-context.md`:

1. **File locations**:
   - MODIFY: `src/brands/brand.njk` - Add brand page JSON-LD
   - MODIFY: `src/index.njk` - Add homepage JSON-LD
   - CREATE: `src/_includes/json-ld.njk` - Reusable JSON-LD partial (optional)
   - CREATE: `tests/json-ld.test.js` - Tests for Story 4.3

2. **Naming conventions**:
   - Files: kebab-case
   - JSON-LD: Use schema.org standard property names

3. **No bundler**: Plain Nunjucks templates, inline JSON-LD in script tags

### Schema.org Types to Use

**For Brand Pages:**
- `ItemList` - For listing multiple codes
- Contains `ListItem` for each code
- Alternative: `Product` with `Offer` for each code (more commerce-focused)

**For Homepage:**
- `WebSite` - For the site itself
- `SearchAction` - For the search functionality
- `Organization` - For the site owner

### JSON-LD Examples

**Brand Page (ItemList approach):**
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Codes promo NordVPN",
  "description": "3 codes promo NordVPN vérifiés et récents.",
  "url": "https://crowd-codes.pages.dev/brands/nordvpn/",
  "numberOfItems": 3,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "NORD50",
      "description": "Code promo NordVPN trouvé il y a 2 jours"
    }
  ]
}
```

**Homepage (WebSite with SearchAction):**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Crowd Codes",
  "url": "https://crowd-codes.pages.dev/",
  "description": "Codes promo vérifiés, copiés en un clic. Sans pubs, sans inscription.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://crowd-codes.pages.dev/?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

**Organization (shared):**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Crowd Codes",
  "url": "https://crowd-codes.pages.dev/",
  "description": "Codes promo vérifiés, copiés en un clic."
}
```

### Nunjucks Implementation

**Brand page JSON-LD (in brand.njk):**
```nunjucks
{% block head %}
  {{ super() }}
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Codes promo {{ brand.name | escape }}",
    "description": "{{ brand.codes.length }} codes promo {{ brand.name | escape }} vérifiés.",
    "url": "{{ site.hostname }}/brands/{{ brand.slug }}/",
    "numberOfItems": {{ brand.codes.length }},
    "itemListElement": [
      {% for code in brand.codes | sort(true, false, 'found_at') %}
      {
        "@type": "ListItem",
        "position": {{ loop.index }},
        "name": "{{ code.code | escape }}"
      }{% if not loop.last %},{% endif %}
      {% endfor %}
    ]
  }
  </script>
{% endblock %}
```

**Homepage JSON-LD (in index.njk):**
```nunjucks
{% block head %}
  {{ super() }}
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Crowd Codes",
    "url": "{{ site.hostname }}/",
    "description": "Codes promo vérifiés, copiés en un clic. Sans pubs, sans inscription.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "{{ site.hostname }}/?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }
  </script>
{% endblock %}
```

### JSON Escaping in Nunjucks

**CRITICAL:** Properly escape values that go into JSON:
- Use `| escape` for HTML escaping
- For JSON strings, also handle quotes: `{{ value | replace('"', '\\"') | escape }}`
- Or use Nunjucks `dump` filter for complex objects: `{{ object | dump | safe }}`

**Safe approach for code values:**
```nunjucks
"name": {{ code.code | dump | safe }}
```

### Testing Strategy

**Build-time tests (json-ld.test.js):**

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

describe('JSON-LD Schema Markup (Story 4.3)', () => {
  const projectRoot = process.cwd();

  describe('Brand Page JSON-LD', () => {
    test('brand page has JSON-LD script tag', () => {
      const brandPagePath = join(projectRoot, '_site', 'brands', 'testbrand', 'index.html');
      const content = readFileSync(brandPagePath, 'utf-8');
      assert.match(content, /<script type="application\/ld\+json">/);
    });

    test('brand page JSON-LD is valid JSON', () => {
      const brandPagePath = join(projectRoot, '_site', 'brands', 'testbrand', 'index.html');
      const content = readFileSync(brandPagePath, 'utf-8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      assert.ok(jsonLdMatch, 'JSON-LD script should exist');
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      assert.ok(jsonLd, 'JSON-LD should be valid JSON');
    });

    test('brand page JSON-LD has ItemList type', () => {
      const brandPagePath = join(projectRoot, '_site', 'brands', 'testbrand', 'index.html');
      const content = readFileSync(brandPagePath, 'utf-8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      assert.strictEqual(jsonLd['@type'], 'ItemList');
    });
  });

  describe('Homepage JSON-LD', () => {
    test('homepage has JSON-LD script tag', () => {
      const homepagePath = join(projectRoot, '_site', 'index.html');
      const content = readFileSync(homepagePath, 'utf-8');
      assert.match(content, /<script type="application\/ld\+json">/);
    });

    test('homepage JSON-LD has WebSite type', () => {
      const homepagePath = join(projectRoot, '_site', 'index.html');
      const content = readFileSync(homepagePath, 'utf-8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      assert.strictEqual(jsonLd['@type'], 'WebSite');
    });

    test('homepage JSON-LD has SearchAction', () => {
      const homepagePath = join(projectRoot, '_site', 'index.html');
      const content = readFileSync(homepagePath, 'utf-8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      assert.ok(jsonLd.potentialAction, 'Should have potentialAction');
      assert.strictEqual(jsonLd.potentialAction['@type'], 'SearchAction');
    });
  });
});
```

### What NOT to Implement (Deferred)

Per Story 4.3 scope:
- **NO BreadcrumbList** - Nice to have but not in AC
- **NO Review schema** - No reviews in system
- **NO AggregateRating** - No ratings in system
- **NO Offer schema with prices** - Codes are free

### Edge Cases to Handle

1. **Brand with 0 codes**: ItemList with `numberOfItems: 0` and empty `itemListElement`
2. **Code with special chars**: Proper JSON escaping (quotes, backslashes)
3. **Very long code values**: No truncation needed for JSON-LD
4. **Missing site.hostname**: Use default value

### Validation Tools

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema.org Validator**: https://validator.schema.org/
3. **JSON-LD Playground**: https://json-ld.org/playground/

### Commit Message Template

```
feat: add JSON-LD schema.org markup (Story 4.3)

- Add ItemList schema to brand pages
- Add WebSite schema with SearchAction to homepage
- Include Organization schema
- Proper JSON escaping for dynamic values
```

### References

- [Source: epics.md#Story-4.3] - Acceptance criteria
- [Source: prd.md#FR31] - JSON-LD requirement
- [Schema.org ItemList] - https://schema.org/ItemList
- [Schema.org WebSite] - https://schema.org/WebSite
- [Schema.org SearchAction] - https://schema.org/SearchAction
- [Google Structured Data Guidelines] - https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data

### Project Structure Notes

**Files to create/modify:**
```
crowd-codes/
├── src/
│   ├── _includes/
│   │   └── json-ld.njk       # CREATE (optional): Reusable JSON-LD partial
│   ├── brands/
│   │   └── brand.njk          # MODIFY: Add brand page JSON-LD
│   └── index.njk              # MODIFY: Add homepage JSON-LD
└── tests/
    └── json-ld.test.js        # CREATE: Tests for Story 4.3
```

### Accessibility Checklist

- [x] No accessibility impact (JSON-LD is for search engines, not users)
- [x] JSON-LD is in script tags, not visible to users

### Dependencies

- **Story 4.2**: Uses `site.hostname` global data (added in Story 4.2)
  - If 4.3 is done before 4.2, add `site.hostname` global data first

## Change Log

- 2026-01-19: Story created via create-story workflow
