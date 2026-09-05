import { discoverCatalogue } from "./crawler.js";
import { fetchAndExtractBook } from "./extractor.js";
import { normalizeRecord } from "./normalizer.js";
import { BookRecordSchema } from "./schema.js";
import { saveOutputs } from "./storage.js";
import { ScrapeReporter } from "./reporter.js";

/**
 * Executes the complete polite scraping pipeline.
 * 
 * @param {object} options
 * @param {boolean} [options.injectFailure=false] - Whether to inject a deliberate broken URL for Stage 5 resilience proof
 * @param {number} [options.maxPages=3]
 */
export async function runScraper(options = {}) {
  const { injectFailure = false, maxPages = 3 } = options;
  const reporter = new ScrapeReporter();
  reporter.start();

  console.log("==================================================");
  console.log(" Starting Polite Scraper Pipeline (FlyRank A9)");
  console.log(` Scope: First ${maxPages} catalogue pages`);
  if (injectFailure) {
    console.log(" Mode: RESILIENCE TEST (1 deliberate broken URL injected)");
  }
  console.log("==================================================");

  // 1. Discover Catalogue Pages
  console.log("\n[Step 1/4] Discovering catalogue pages...");
  const { cataloguePages, uniqueUrls } = await discoverCatalogue(
    "https://books.toscrape.com/catalogue/page-1.html",
    maxPages,
    { reporter }
  );
  console.log(`Discovered ${uniqueUrls.length} unique book links across ${cataloguePages} catalogue pages.`);

  // If testing resilience, inject one deliberate broken URL
  const itemsToFetch = [...uniqueUrls];
  if (injectFailure) {
    itemsToFetch.push({
      productUrl: "https://books.toscrape.com/catalogue/deliberately-broken-fake-book-page_99999/index.html",
      sourcePage: "https://books.toscrape.com/catalogue/page-test-failure.html",
    });
  }

  // 2. Fetch & Extract Book Details (Isolated Error Handling per Page)
  console.log(`\n[Step 2/4] Fetching & extracting ${itemsToFetch.length} detail pages...`);
  const validRecords = [];
  const errorRecords = [];

  for (const { productUrl, sourcePage } of itemsToFetch) {
    try {
      const { record: raw, fromCache } = await fetchAndExtractBook(productUrl, sourcePage);
      reporter.recordFetch(fromCache);

      // 3. Normalize & Schema Validation
      const normalized = normalizeRecord(raw);
      const validation = BookRecordSchema.safeParse(normalized);

      if (validation.success) {
        validRecords.push(validation.data);
        reporter.recordValidation(true);
      } else {
        reporter.recordValidation(false);
        console.warn(`[VALIDATION ERROR] Record schema mismatch for ${productUrl}`);
        errorRecords.push({
          record: normalized,
          errors: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
          failed_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      // One broken page must NOT crash the remaining pipeline
      console.warn(`[PAGE SKIPPED] Error fetching ${productUrl}: ${err.message}`);
      reporter.recordFailure(productUrl, err);
    }
  }

  // 4. Save Outputs & Finalize Run Report
  console.log("\n[Step 3/4] Storing validated datasets...");
  const { booksFile, recordCount, errorCount } = await saveOutputs(validRecords, errorRecords);
  console.log(`- Valid records stored: ${recordCount} in ${booksFile}`);
  if (errorCount > 0) {
    console.log(`- Invalid records stored: ${errorCount} in output/errors.json`);
  }

  console.log("\n[Step 4/4] Generating run audit report...");
  const report = await reporter.finishAndSave();
  console.log("Run Report Summary:");
  console.log(JSON.stringify(report, null, 2));

  return { report, recordCount };
}

// CLI Execution Entry Point
if (process.argv[1] && process.argv[1].endsWith("index.js")) {
  const isResilienceTest = process.argv.includes("--test-resilience");
  runScraper({ injectFailure: isResilienceTest }).catch((err) => {
    console.error("Fatal pipeline error:", err);
    process.exit(1);
  });
}
