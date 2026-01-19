import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Tests for Story 3.7: Create Basic Brand Page Access
 *
 * Tests verify:
 * - Brand page template exists with correct pagination
 * - Brand data is extracted from codes.json
 * - Generated HTML includes brand-specific content
 * - Copy functionality works on brand pages
 * - Empty state displays when brand has no codes
 */

describe('Brand Page Template (Story 3.7)', () => {
  const projectRoot = process.cwd();
  const brandTemplatePath = join(projectRoot, 'src', 'brands', 'brand.njk');

  describe('AC#1: Brand template and pagination', () => {
    test('src/brands/brand.njk template exists', () => {
      assert.ok(existsSync(brandTemplatePath),
        'Brand page template should exist at src/brands/brand.njk');
    });

    test('brand.njk has pagination configuration', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /pagination:/,
        'Template should have pagination configuration');
    });

    test('brand.njk paginates over brands data', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /data:\s*brands/,
        'Pagination should use brands data');
    });

    test('brand.njk has correct permalink format', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /permalink:.*brands.*slug/,
        'Permalink should use /brands/{{ brand.slug }}/ format');
    });

    test('brand.njk extends base.njk', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /extends\s+["']base\.njk["']/,
        'Template should extend base.njk');
    });
  });
});

describe('Brand Data Generation (Story 3.7)', () => {
  const projectRoot = process.cwd();
  const brandsDataPath = join(projectRoot, 'src', '_data', 'brands.js');

  describe('AC#1: Brand data extraction', () => {
    test('src/_data/brands.js exists', () => {
      assert.ok(existsSync(brandsDataPath),
        'Brand data file should exist at src/_data/brands.js');
    });

    test('brands.js exports a function', async () => {
      const brandsModule = await import(brandsDataPath);
      assert.ok(typeof brandsModule.default === 'function',
        'brands.js should export a default function');
    });

    test('brands.js extracts unique brands from codes.json', async () => {
      // brands.js now reads codes.json directly, so we test with current test data
      const brandsModule = await import(brandsDataPath);
      const brands = brandsModule.default();

      // With test data in codes.json (testbrand)
      assert.ok(Array.isArray(brands), 'Should return an array');
      assert.ok(brands.length >= 1, 'Should extract at least 1 brand from test data');
    });

    test('brands.js includes codes for each brand', async () => {
      const brandsModule = await import(brandsDataPath);
      const brands = brandsModule.default();

      // Each brand should have a codes array
      for (const brand of brands) {
        assert.ok(Array.isArray(brand.codes), `Brand ${brand.slug} should have codes array`);
        assert.ok(brand.codes.length > 0, `Brand ${brand.slug} should have at least one code`);
      }
    });

    test('brands.js returns sorted brands', async () => {
      const brandsModule = await import(brandsDataPath);
      const brands = brandsModule.default();

      // Verify brands are sorted alphabetically by name
      for (let i = 1; i < brands.length; i++) {
        const comparison = brands[i - 1].name.localeCompare(brands[i].name, 'fr');
        assert.ok(comparison <= 0, `Brands should be sorted: ${brands[i - 1].name} should come before ${brands[i].name}`);
      }
    });
  });
});

describe('Brand Page Content (Story 3.7)', () => {
  const projectRoot = process.cwd();
  const brandTemplatePath = join(projectRoot, 'src', 'brands', 'brand.njk');

  describe('AC#2: Brand page displays codes', () => {
    test('brand.njk displays brand name in h1', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /<h1>.*brand\.name.*<\/h1>/s,
        'Should display brand name in h1');
    });

    test('brand.njk has results container with aria-label', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /id=["']results["']/,
        'Should have results container with id="results"');
      assert.match(content, /aria-label/,
        'Results container should have aria-label');
    });

    test('brand.njk iterates over brand.codes', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /for\s+code\s+in\s+brand\.codes/,
        'Should iterate over brand.codes');
    });

    test('brand.njk uses CodeCard structure', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /class=["']code-card["']/,
        'Should use code-card class');
      assert.match(content, /class=["']code-value["']/,
        'Should use code-value class');
      assert.match(content, /class=["']copy-btn["']/,
        'Should use copy-btn class');
    });

    test('brand.njk has copy button with aria-label', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /copy-btn.*aria-label/s,
        'Copy button should have aria-label');
    });

    test('brand.njk has data-code-value attribute for copy', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /data-code-value/,
        'Should have data-code-value for copy functionality');
    });
  });
});

describe('Empty State Handling (Story 3.7)', () => {
  const projectRoot = process.cwd();
  const brandTemplatePath = join(projectRoot, 'src', 'brands', 'brand.njk');

  describe('AC#2: Empty brand state', () => {
    test('brand.njk shows empty state when no codes', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /empty-state/,
        'Should have empty-state class');
    });

    test('brand.njk empty state uses role="status"', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /empty-state.*role=["']status["']/s,
        'Empty state should have role="status"');
    });

    test('brand.njk empty state includes brand context', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /empty-state-title.*brand\.name/s,
        'Empty state should include brand name');
    });

    test('brand.njk has empathetic empty state message', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /empty-state-message/,
        'Should have empty-state-message');
      assert.match(content, /empty-state-suggestion/,
        'Should have empty-state-suggestion');
    });
  });
});

describe('Page Metadata (Story 3.7)', () => {
  const projectRoot = process.cwd();
  const brandTemplatePath = join(projectRoot, 'src', 'brands', 'brand.njk');

  describe('AC#1: Basic metadata', () => {
    test('brand.njk has eleventyComputed for dynamic data', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /eleventyComputed:/,
        'Should use eleventyComputed for dynamic frontmatter');
    });

    test('brand.njk has title with brand name', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /title:.*brand\.name/,
        'Should have title with brand name');
    });

    test('brand.njk has description with brand name', () => {
      const content = readFileSync(brandTemplatePath, 'utf-8');
      assert.match(content, /description:.*brand\.name/,
        'Should have description with brand name');
    });
  });
});

describe('Navigation (Story 3.7)', () => {
  const projectRoot = process.cwd();
  const brandTemplatePath = join(projectRoot, 'src', 'brands', 'brand.njk');

  test('brand.njk has back link to homepage', () => {
    const content = readFileSync(brandTemplatePath, 'utf-8');
    assert.match(content, /href=["']\/["']/,
      'Should have link back to homepage');
  });
});

describe('Build Verification (Story 3.7)', () => {
  const projectRoot = process.cwd();

  before(() => {
    // Add test data temporarily
    const codesPath = join(projectRoot, 'src', '_data', 'codes.json');
    const testData = {
      meta: { generated_at: new Date().toISOString(), total_codes: 2, total_brands: 1 },
      codes: [
        {
          id: 'test-1',
          code: 'TEST10',
          brand_name: 'TestBrand',
          brand_slug: 'testbrand',
          source_channel: 'TestChannel',
          found_at: new Date().toISOString()
        },
        {
          id: 'test-2',
          code: 'TEST20',
          brand_name: 'TestBrand',
          brand_slug: 'testbrand',
          source_channel: 'TestChannel',
          found_at: new Date().toISOString()
        }
      ]
    };

    // Write test data using imported writeFileSync
    writeFileSync(codesPath, JSON.stringify(testData, null, 2));

    // Build the site
    execSync('npm run build', { stdio: 'inherit' });
  });

  test('build generates brand page at /brands/testbrand/', () => {
    const brandPagePath = join(projectRoot, '_site', 'brands', 'testbrand', 'index.html');
    assert.ok(existsSync(brandPagePath),
      'Should generate brand page at /brands/testbrand/index.html');
  });

  test('generated brand page contains brand name', () => {
    const brandPagePath = join(projectRoot, '_site', 'brands', 'testbrand', 'index.html');
    const content = readFileSync(brandPagePath, 'utf-8');
    assert.match(content, /TestBrand/,
      'Brand page should contain brand name');
  });

  test('generated brand page contains code cards', () => {
    const brandPagePath = join(projectRoot, '_site', 'brands', 'testbrand', 'index.html');
    const content = readFileSync(brandPagePath, 'utf-8');
    assert.match(content, /TEST10/,
      'Brand page should contain test code');
    assert.match(content, /code-card/,
      'Brand page should have code-card elements');
  });

  test('generated brand page has copy button', () => {
    const brandPagePath = join(projectRoot, '_site', 'brands', 'testbrand', 'index.html');
    const content = readFileSync(brandPagePath, 'utf-8');
    assert.match(content, /copy-btn/,
      'Brand page should have copy button');
  });
});
