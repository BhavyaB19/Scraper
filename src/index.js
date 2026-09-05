import { fetchWithCache } from "./client.js";

async function main() {
  const targetUrl = "https://books.toscrape.com/catalogue/page-1.html";
  console.log(`Starting Stage 1: Fetch and cache test for ${targetUrl}`);
  
  const result = await fetchWithCache(targetUrl);
  console.log(`Result: source=${result.fromCache ? "CACHE HIT" : "FETCH"}, status=${result.status}, size=${result.sizeBytes} bytes`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
