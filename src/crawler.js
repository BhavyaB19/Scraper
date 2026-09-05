import * as cheerio from "cheerio";
import { fetchWithCache } from "./client.js";

/**
 * Crawls catalogue pages up to maxPages, following the pagination "next" link.
 * Extracts book links, resolving relative URLs into canonical absolute URLs.
 * 
 * @param {string} startUrl - Initial catalogue page URL
 * @param {number} maxPages - Maximum number of catalogue pages to crawl (default 3)
 * @param {object} [options]
 * @param {import("./reporter.js").ScrapeReporter} [options.reporter]
 * @returns {Promise<{ cataloguePages: number, discovered: number, uniqueUrls: Array<{ productUrl: string, sourcePage: string }> }>}
 */
export async function discoverCatalogue(startUrl = "https://books.toscrape.com/catalogue/page-1.html", maxPages = 3, options = {}) {
  let currentUrl = startUrl;
  let pagesProcessed = 0;
  const discoveredItems = [];
  const uniqueUrlMap = new Map();

  while (currentUrl && pagesProcessed < maxPages) {
    pagesProcessed++;
    const { html, fromCache } = await fetchWithCache(currentUrl, options);
    if (options.reporter) {
      options.reporter.recordFetch(fromCache);
    }
    const $ = cheerio.load(html);

    // Locate book cards in catalogue
    $("article.product_pod").each((_, element) => {
      const linkElem = $(element).find("h3 > a");
      const relativeHref = linkElem.attr("href");
      if (relativeHref) {
        // Resolve canonical absolute URL safely using URL API
        const absoluteUrl = new URL(relativeHref, currentUrl).href;
        discoveredItems.push({
          productUrl: absoluteUrl,
          sourcePage: currentUrl,
        });

        if (!uniqueUrlMap.has(absoluteUrl)) {
          uniqueUrlMap.set(absoluteUrl, {
            productUrl: absoluteUrl,
            sourcePage: currentUrl,
          });
        }
      }
    });

    // Check for "next" page link
    const nextHref = $("li.next > a").attr("href") || $(".pager .next a").attr("href");
    if (nextHref && pagesProcessed < maxPages) {
      currentUrl = new URL(nextHref, currentUrl).href;
    } else {
      currentUrl = null;
    }
  }

  return {
    cataloguePages: pagesProcessed,
    discovered: discoveredItems.length,
    uniqueUrls: Array.from(uniqueUrlMap.values()),
  };
}
