// .eleventy.js (ESM format)

export default function(eleventyConfig) {
  // Custom filter: Format date as French month and year (Story 4.1)
  eleventyConfig.addFilter("dateMonthYear", function(date) {
    const d = date ? new Date(date) : new Date();
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  // Custom filter: Format relative date in French (Story 3.3)
  // NOTE: Intentionally duplicated in public/js/search.js for client-side - no bundler in project
  eleventyConfig.addFilter("formatRelativeDate", function(isoDate) {
    // Validate input - return fallback for invalid dates
    if (!isoDate) return 'date inconnue';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return 'date invalide';
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        return 'il y a quelques minutes';
      }
      return `il y a ${diffHours}h`;
    }
    if (diffDays === 1) return 'hier';
    if (diffDays < 7) return `il y a ${diffDays} jours`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  });

  // Site hostname - configurable via env for forks (used for SEO, sitemap, JSON-LD)
  const siteHostname = process.env.SITE_HOSTNAME || "https://crowd-codes.pages.dev";

  // Global data for templates (Story 4.1, 4.2, 4.3)
  eleventyConfig.addGlobalData("site", {
    hostname: siteHostname
  });

  // Passthrough copy for static assets (public/* -> _site/*)
  eleventyConfig.addPassthroughCopy({ "public": "/" });

  // Copy codes.json to root of _site for client-side fetch
  eleventyConfig.addPassthroughCopy({ "src/_data/codes.json": "codes.json" });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}
