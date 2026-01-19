// .eleventy.js (ESM format)
import pluginSitemap from "@quasibit/eleventy-plugin-sitemap";

export default function(eleventyConfig) {
  // Sitemap plugin - hostname configurable via env for forks
  const siteHostname = process.env.SITE_HOSTNAME || "https://crowd-codes.pages.dev";
  eleventyConfig.addPlugin(pluginSitemap, {
    sitemap: {
      hostname: siteHostname
    }
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
