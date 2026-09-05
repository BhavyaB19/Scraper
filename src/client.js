import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const USER_AGENT = "FlyRankInternship-A9/1.0 (+https://github.com/flyrank/scraper)";
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_POLITE_DELAY_MS = 500;
const CACHE_DIR = path.resolve(process.cwd(), "cache");

let lastLiveRequestTime = 0;

/**
 * Maps a URL to a safe, readable cache filename.
 * @param {string} url 
 * @returns {string}
 */
export function getCacheFilePath(url) {
  const parsed = new URL(url);
  const cleanPath = parsed.pathname.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
  // If specific known page, name nicely, e.g. catalogue-page-1.html
  if (cleanPath.endsWith(".html")) {
    return path.join(CACHE_DIR, cleanPath);
  }
  const hash = crypto.createHash("md5").update(url).digest("hex").slice(0, 8);
  return path.join(CACHE_DIR, `${cleanPath}-${hash}.html`);
}

/**
 * Ensures a polite delay between live HTTP requests.
 * Cached requests do not delay.
 */
async function enforcePoliteDelay(delayMs = DEFAULT_POLITE_DELAY_MS) {
  const now = Date.now();
  const timeSinceLast = now - lastLiveRequestTime;
  if (timeSinceLast < delayMs) {
    await new Promise((resolve) => setTimeout(resolve, delayMs - timeSinceLast));
  }
  lastLiveRequestTime = Date.now();
}

/**
 * Fetches HTML from a URL with caching, polite delay, timeout, and custom User-Agent.
 * 
 * @param {string} url 
 * @param {object} options
 * @param {boolean} [options.bypassCache=false]
 * @param {number} [options.timeoutMs=5000]
 * @param {number} [options.delayMs=500]
 * @param {number} [options.maxRetries=1]
 * @returns {Promise<{ html: string, fromCache: boolean, status: number, sizeBytes: number }>}
 */
export async function fetchWithCache(url, options = {}) {
  const {
    bypassCache = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    delayMs = DEFAULT_POLITE_DELAY_MS,
    maxRetries = 1,
  } = options;

  await fs.mkdir(CACHE_DIR, { recursive: true });
  const cachePath = getCacheFilePath(url);

  if (!bypassCache) {
    try {
      const stats = await fs.stat(cachePath);
      if (stats.isFile()) {
        const cachedHtml = await fs.readFile(cachePath, "utf-8");
        console.log(`[CACHE HIT] ${url} (${cachedHtml.length} bytes)`);
        return {
          html: cachedHtml,
          fromCache: true,
          status: 200,
          sizeBytes: cachedHtml.length,
        };
      }
    } catch {
      // Cache miss, proceed to live fetch
    }
  }

  // Live fetch with retry capability
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      await enforcePoliteDelay(delayMs);

      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.status !== 200) {
        // Do not retry 404 or 403 as per polite scraping guidelines
        if (response.status === 404 || response.status === 403) {
          throw new Error(`HTTP ${response.status} ${response.statusText} for ${url} (non-retryable)`);
        }
        // If 5xx, retry if attempts remain
        if (response.status >= 500 && attempt < maxRetries) {
          attempt++;
          console.warn(`[RETRY ${attempt}/${maxRetries}] Server error ${response.status} for ${url}. Waiting before retry...`);
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
      }

      const html = await response.text();
      await fs.writeFile(cachePath, html, "utf-8");
      console.log(`[FETCH] ${url} (Status 200, ${html.length} bytes)`);

      return {
        html,
        fromCache: false,
        status: 200,
        sizeBytes: html.length,
      };
    } catch (err) {
      if (attempt < maxRetries && (err.name === "TimeoutError" || err.message.includes("network") || err.name === "AbortError")) {
        attempt++;
        console.warn(`[RETRY ${attempt}/${maxRetries}] ${err.name}: ${err.message}. Retrying...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }
}
