import { discoverCatalogue } from "./crawler.js";

async function main() {
  console.log("=== Stage 2: Discover Three Catalogue Pages ===");
  const { cataloguePages, discovered, uniqueUrls } = await discoverCatalogue(
    "https://books.toscrape.com/catalogue/page-1.html",
    3
  );

  console.log(`catalogue_pages=${cataloguePages}, discovered=${discovered}, unique_urls=${uniqueUrls.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
