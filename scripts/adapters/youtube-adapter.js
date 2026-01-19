/**
 * YouTube Adapter - Adapter Pattern for YouTube Data API v3
 * Story 2.2: Implement YouTube Scraper with Adapter Pattern
 *
 * Abstracts YouTube API to return normalized InternalVideoModel format
 * Tracks quota usage to stay within daily limits
 */

/**
 * Internal video model - abstracted from source
 * @typedef {Object} InternalVideoModel
 * @property {string} video_id - Unique video identifier
 * @property {string} channel_name - Channel/creator name
 * @property {string} description - Full video description
 * @property {string} published_at - ISO 8601 timestamp
 * @property {string} source_type - Always "youtube" for this adapter
 */

/**
 * Keywords to search for promo codes in French YouTube videos
 */
export const KEYWORDS = [
  'code promo',
  'réduction',
  'discount',
  'promo code',
];

/**
 * YouTube Data API v3 quota costs per operation
 */
export const QUOTA_COSTS = {
  SEARCH: 100,
  VIDEO_DETAILS: 1,
};

/**
 * Daily quota limit for YouTube Data API
 * Conservative limit to stay well under API restrictions
 */
export const DAILY_QUOTA_LIMIT = 5000;

/**
 * Fetch timeout in milliseconds (30 seconds)
 */
export const FETCH_TIMEOUT_MS = 30000;

/**
 * YouTube API base URL
 */
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Fetch with timeout using AbortController
 * @param {string} url - URL to fetch
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * YouTubeAdapter class implementing the adapter pattern
 * Converts YouTube API responses to InternalVideoModel format
 */
export class YouTubeAdapter {
  /**
   * Create a YouTubeAdapter instance
   * @param {string} apiKey - YouTube Data API v3 key
   * @throws {Error} If API key is missing or empty
   */
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY is required');
    }
    this.apiKey = apiKey;
    this.quotaUsed = 0;
  }

  /**
   * Get the total quota units used in this session
   * @returns {number} Quota units consumed
   */
  getQuotaUsed() {
    return this.quotaUsed;
  }

  /**
   * Check if we can afford a quota cost
   * @param {number} cost - Quota units required
   * @returns {boolean} True if within daily limit
   */
  canAffordQuota(cost) {
    return this.quotaUsed + cost <= DAILY_QUOTA_LIMIT;
  }

  /**
   * Build search URL for YouTube API
   * @param {string} keyword - Search keyword
   * @param {Object} options - Search options
   * @returns {URL} Configured search URL
   */
  buildSearchUrl(keyword, options = {}) {
    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', keyword);
    url.searchParams.set('type', 'video');
    url.searchParams.set('regionCode', options.regionCode || 'FR');
    url.searchParams.set('relevanceLanguage', options.language || 'fr');
    url.searchParams.set('maxResults', String(options.maxResults || 50));
    url.searchParams.set('key', this.apiKey);

    if (options.publishedAfter) {
      url.searchParams.set('publishedAfter', options.publishedAfter);
    }

    return url;
  }

  /**
   * Build video details URL for YouTube API
   * @param {string[]} videoIds - Array of video IDs
   * @returns {URL} Configured videos URL
   */
  buildVideosUrl(videoIds) {
    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('id', videoIds.join(','));
    url.searchParams.set('key', this.apiKey);
    return url;
  }

  /**
   * Normalize YouTube API response item to InternalVideoModel
   * @param {Object} item - YouTube API video item
   * @returns {InternalVideoModel|null} Normalized video model or null if invalid
   */
  normalizeVideoItem(item) {
    if (!item || !item.snippet) {
      return null;
    }

    const isSearchResult = item.id?.videoId !== undefined;
    const videoId = isSearchResult ? item.id.videoId : item.id;

    if (!videoId) {
      return null;
    }

    return {
      video_id: videoId,
      channel_name: item.snippet.channelTitle || 'Unknown Channel',
      description: item.snippet.description || '',
      published_at: item.snippet.publishedAt || new Date().toISOString(),
      source_type: 'youtube',
    };
  }

  /**
   * Search for videos matching a keyword
   * @param {string} keyword - Search keyword
   * @param {Object} options - Search options
   * @returns {Promise<{videoIds: string[], items: Object[]}>} Search results
   */
  async searchVideos(keyword, options = {}) {
    if (!this.canAffordQuota(QUOTA_COSTS.SEARCH)) {
      throw new Error('Quota exceeded: cannot perform search');
    }

    const url = this.buildSearchUrl(keyword, options);
    const response = await fetchWithTimeout(url.toString());

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `YouTube API search failed: ${response.status} - ${error.error?.message || 'Unknown error'}`
      );
    }

    this.quotaUsed += QUOTA_COSTS.SEARCH;

    const data = await response.json();
    const videoIds = (data.items || []).map((item) => item.id.videoId);

    return {
      videoIds,
      items: data.items || [],
    };
  }

  /**
   * Get full video details including complete descriptions
   * @param {string[]} videoIds - Array of video IDs
   * @returns {Promise<InternalVideoModel[]>} Video details
   */
  async getVideoDetails(videoIds) {
    if (!videoIds.length) {
      return [];
    }

    const quotaCost = videoIds.length * QUOTA_COSTS.VIDEO_DETAILS;
    if (!this.canAffordQuota(quotaCost)) {
      throw new Error('Quota exceeded: cannot fetch video details');
    }

    const url = this.buildVideosUrl(videoIds);
    const response = await fetchWithTimeout(url.toString());

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `YouTube API videos failed: ${response.status} - ${error.error?.message || 'Unknown error'}`
      );
    }

    this.quotaUsed += quotaCost;

    const data = await response.json();
    return (data.items || [])
      .map((item) => this.normalizeVideoItem(item))
      .filter((video) => video !== null);
  }

  /**
   * Fetch videos matching keywords with full descriptions
   * @param {string[]} keywords - Keywords to search (defaults to KEYWORDS)
   * @param {Object} options - Fetch options
   * @param {string} options.publishedAfter - ISO 8601 date to filter by
   * @param {number} options.maxResults - Max results per keyword (default 50)
   * @returns {Promise<InternalVideoModel[]>} Normalized video models
   */
  async fetchVideos(keywords = KEYWORDS, options = {}) {
    const allVideos = new Map();

    for (const keyword of keywords) {
      if (!this.canAffordQuota(QUOTA_COSTS.SEARCH)) {
        console.log(
          JSON.stringify({
            event: 'quota_limit_reached',
            quota_used: this.quotaUsed,
            limit: DAILY_QUOTA_LIMIT,
            skipped_keyword: keyword,
          })
        );
        break;
      }

      try {
        const { videoIds } = await this.searchVideos(keyword, options);

        if (videoIds.length > 0) {
          const details = await this.getVideoDetails(videoIds);
          for (const video of details) {
            if (!allVideos.has(video.video_id)) {
              allVideos.set(video.video_id, video);
            }
          }
        }
      } catch (error) {
        console.error(
          JSON.stringify({
            error: error.message,
            code: 'SEARCH_ERROR',
            keyword,
          })
        );
      }
    }

    return Array.from(allVideos.values());
  }
}

/**
 * Factory function to create YouTubeAdapter
 * @param {string} apiKey - YouTube Data API key
 * @returns {YouTubeAdapter} Configured adapter instance
 */
export function createYouTubeAdapter(apiKey) {
  return new YouTubeAdapter(apiKey);
}
