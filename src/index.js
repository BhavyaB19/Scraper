import fs from "node:fs/promises";
import path from "node:path";
import { discoverCatalogue } from "./crawler.js";
import { fetchAndExtractBook } from "./extractor.js";
import { normalizeRecord } from "./normalizer.js";
import { BookRecordSchema } from "./schema.js";
import { saveOutputs } from "./storage.js";

async function main() {
  console.log("=== Stage 4: Clean it, Check it, Store it ===");

  const { uniqueUrls } = await discoverCatalogue(
    "https://books.toscrape.com/catalogue/page-1.html",
    3
  );

  console.log(`Discovered ${uniqueUrls.length} unique book URLs.`);

  const validRecords = [];
  const errorRecords = [];

  for (const { productUrl, sourcePage } of uniqueUrls) {
    const raw = await fetchAndExtractBook(productUrl, sourcePage);
    const normalized = normalizeRecord(raw);

    const validation = BookRecordSchema.safeParse(normalized);
    if (validation.success) {
      validRecords.push(validation.data);
    } else {
      console.warn(`Validation failed for ${productUrl}:`, validation.error.issues);
      errorRecords.push({
        record: normalized,
        errors: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        failed_at: new Date().toISOString(),
      });
    }
  }

  const { booksFile, recordCount, errorCount } = await saveOutputs(validRecords, errorRecords);
  console.log(`Saved ${recordCount} valid records to ${booksFile} (errors: ${errorCount})`);

  // Verification checks for Stage 4 Checkpoint
  const fileContent = JSON.parse(await fs.readFile(booksFile, "utf-8"));
  const countMatches = fileContent.length === 60;
  const allPricesAreNumbers = fileContent.every((r) => typeof r.price_gbp === "number" && !isNaN(r.price_gbp));
  const allUrlsHttps = fileContent.every((r) => r.product_url.startsWith("https://") && r.source_page.startsWith("https://"));

  console.log(`Checkpoint Validation:`);
  console.log(`- Exact 60 records: ${countMatches} (${fileContent.length})`);
  console.log(`- Every price_gbp is numeric: ${allPricesAreNumbers}`);
  console.log(`- Every URL starts with https://: ${allUrlsHttps}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
