import { discoverCatalogue } from "./crawler.js";
import { fetchAndExtractBook } from "./extractor.js";

async function main() {
  console.log("=== Stage 3: Extract Book Details ===");
  const { uniqueUrls } = await discoverCatalogue(
    "https://books.toscrape.com/catalogue/page-1.html",
    3
  );

  console.log(`Discovered ${uniqueUrls.length} unique book URLs. Fetching & extracting details...`);

  const rawRecords = [];
  for (let i = 0; i < uniqueUrls.length; i++) {
    const { productUrl, sourcePage } = uniqueUrls[i];
    const record = await fetchAndExtractBook(productUrl, sourcePage);
    rawRecords.push(record);
  }

  console.log("\nSample raw record (1 of 60):");
  console.log(JSON.stringify(rawRecords[0], null, 2));

  console.log(`\ndetail_pages=${rawRecords.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
