import * as cheerio from "cheerio";
import { fetchWithCache } from "./client.js";

/**
 * Extracts raw book attributes from a detail page HTML string.
 * Selectors are targeted specifically at the product content area.
 * 
 * @param {string} html - HTML string of the product page
 * @param {string} productUrl - Absolute URL of the product page
 * @param {string} sourcePage - Catalogue page where the link was found
 * @returns {object} Raw record with 8 required keys
 */
export function extractRawRecord(html, productUrl, sourcePage) {
  const $ = cheerio.load(html);
  const productArea = $("article.product_page, .product_main");

  // Title
  const title = productArea.find("h1").first().text().trim();

  // Price text
  const priceText = productArea.find("p.price_color").first().text().trim();

  // Availability text (collapse internal whitespace)
  const rawAvailability = productArea.find("p.instock.availability").first().text();
  const availabilityText = rawAvailability ? rawAvailability.replace(/\s+/g, " ").trim() : "";

  // Star rating
  const ratingElement = productArea.find("p.star-rating").first();
  let ratingText = "";
  if (ratingElement.length > 0) {
    const classList = (ratingElement.attr("class") || "").split(/\s+/);
    const starClass = classList.find((cls) => cls !== "star-rating");
    ratingText = starClass || "";
  }

  // Description (#product_description header followed by sibling <p>)
  const descElem = $("#product_description").next("p");
  let description = null;
  if (descElem.length > 0) {
    const text = descElem.text().trim();
    if (text.length > 0) {
      description = text;
    }
  }

  return {
    title,
    product_url: productUrl,
    price_text: priceText,
    availability_text: availabilityText,
    rating_text: ratingText,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Fetches and extracts a raw book detail record.
 * 
 * @param {string} productUrl 
 * @param {string} sourcePage 
 * @param {object} [options] 
 * @returns {Promise<{ record: object, fromCache: boolean }>}
 */
export async function fetchAndExtractBook(productUrl, sourcePage, options = {}) {
  const { html, fromCache } = await fetchWithCache(productUrl, options);
  const record = extractRawRecord(html, productUrl, sourcePage);
  return { record, fromCache };
}
