/**
 * Normalizes raw book record fields into standardized data types.
 * Keeps raw fields alongside cleaned fields (e.g. price_text alongside price_gbp).
 * 
 * @param {object} rawRecord
 * @returns {object} Normalized record
 */
export function normalizeRecord(rawRecord) {
  // Extract number from currency string (e.g., "£51.77" -> 51.77)
  let price_gbp = NaN;
  if (typeof rawRecord.price_text === "string") {
    const numericMatch = rawRecord.price_text.replace(/[^0-9.]/g, "");
    price_gbp = parseFloat(numericMatch);
  }

  // Ensure description is properly nullable string
  let description = rawRecord.description;
  if (typeof description === "string") {
    description = description.trim();
    if (description.length === 0) {
      description = null;
    }
  } else {
    description = null;
  }

  return {
    title: typeof rawRecord.title === "string" ? rawRecord.title.trim() : "",
    product_url: rawRecord.product_url,
    price_text: rawRecord.price_text,
    price_gbp: isNaN(price_gbp) ? 0 : price_gbp,
    availability_text: typeof rawRecord.availability_text === "string" ? rawRecord.availability_text.trim() : "",
    rating_text: typeof rawRecord.rating_text === "string" ? rawRecord.rating_text.trim() : "",
    description,
    source_page: rawRecord.source_page,
    fetched_at: rawRecord.fetched_at || new Date().toISOString(),
  };
}
