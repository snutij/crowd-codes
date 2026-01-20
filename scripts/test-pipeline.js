#!/usr/bin/env node
/**
 * Test Pipeline - Local testing without DB
 *
 * Scrapes a small sample of videos, parses them, outputs JSON.
 * Usage: npm run test:pipeline -- --limit 10
 */

import { YouTubeAdapter, KEYWORDS } from './adapters/youtube-adapter.js';
import { RegexParser } from './parsers/regex-parser.js';
import { LlmParser } from './parsers/llm-parser.js';

const PATTERNS_PATH = process.env.PATTERNS_PATH || 'data/patterns.json';

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: 10,
    skipLlm: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === '--skip-llm') {
      options.skipLlm = true;
    }
  }

  return options;
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const options = parseArgs();
  const results = {
    options,
    videos: [],
    codes: {
      regex: [],
      llm: [],
    },
    stats: {
      videos_fetched: 0,
      regex_codes: 0,
      llm_codes: 0,
      regex_failed: 0,
    },
  };

  // Check API key
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error(JSON.stringify({ error: 'YOUTUBE_API_KEY required' }));
    process.exit(2);
  }

  try {
    // 1. Fetch videos
    console.error(`Fetching ${options.limit} videos...`);
    const adapter = new YouTubeAdapter(apiKey);
    const publishedAfter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const allVideos = await adapter.fetchVideos(KEYWORDS, {
      publishedAfter,
      maxResults: Math.min(options.limit, 50),
    });

    const videos = allVideos.slice(0, options.limit);
    results.stats.videos_fetched = videos.length;
    console.error(`Fetched ${videos.length} videos`);

    // 2. Parse with regex
    console.error('Parsing with regex...');
    const regexParser = new RegexParser(PATTERNS_PATH);

    for (const video of videos) {
      const codes = regexParser.parseDescription(video.description, video.video_id);

      results.videos.push({
        video_id: video.video_id,
        channel: video.channel_name,
        description_preview: video.description.slice(0, 200) + '...',
        regex_codes: codes,
        llm_codes: [],
      });

      if (codes.length > 0) {
        results.codes.regex.push(...codes);
        results.stats.regex_codes += codes.length;
      } else {
        results.stats.regex_failed++;
      }
    }

    console.error(`Regex: ${results.stats.regex_codes} codes found, ${results.stats.regex_failed} videos without codes`);

    // 3. LLM fallback (if enabled and API key present)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!options.skipLlm && geminiKey && results.stats.regex_failed > 0) {
      console.error('Running LLM fallback (4s delay between calls)...');
      const llmParser = new LlmParser(geminiKey);

      const failedVideos = results.videos.filter((v) => v.regex_codes.length === 0);

      for (let i = 0; i < failedVideos.length; i++) {
        const videoResult = failedVideos[i];
        const video = videos.find((v) => v.video_id === videoResult.video_id);

        // Rate limit
        if (i > 0) {
          await sleep(4000);
        }

        console.error(`  LLM parsing ${i + 1}/${failedVideos.length}: ${video.video_id}`);

        const result = await llmParser.parseDescription(video.description, video.video_id);

        if (result.success && result.codes.length > 0) {
          videoResult.llm_codes = result.codes;
          results.codes.llm.push(...result.codes);
          results.stats.llm_codes += result.codes.length;
        }
      }

      console.error(`LLM: ${results.stats.llm_codes} additional codes found`);
    } else if (options.skipLlm) {
      console.error('LLM fallback skipped (--skip-llm flag)');
    } else if (!geminiKey) {
      console.error('LLM fallback skipped (no GEMINI_API_KEY)');
    }

    // 4. Output JSON
    console.log(JSON.stringify(results, null, 2));

  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}

main();
