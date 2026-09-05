# The Polite Scraper (FlyRank Assignment A9)

A polite, robust web scraping pipeline built in **JavaScript (Node.js 20+)** using native `fetch`, `cheerio`, and `zod`. It scrapes the first three catalogue pages of **Books to Scrape**, visits all 60 book detail pages, extracts and normalizes the data, validates every record against a strict schema, survives broken pages gracefully, and generates an honest audit run report.

---

## 1. Target Classification

- **Target Site**: Books to Scrape (`https://books.toscrape.com/`)
- **Why**: Books to Scrape is an open public sandbox environment designed specifically for developers to practice web scraping and automation legally and safely.
- **Scope**: Exactly the first 3 catalogue pages (`catalogue/page-1.html` to `catalogue/page-3.html`), discovering and parsing all 60 book detail pages.
- **Data Collected**:
  - `title` (string): Title of the book.
  - `product_url` (string, URL): Canonical absolute HTTPS URL of the book detail page.
  - `price_text` (string): Raw price string as shown on the page (e.g. `£51.77`).
  - `price_gbp` (number): Cleaned numeric price in GBP (e.g. `51.77`).
  - `availability_text` (string): Cleaned stock status string (e.g. `In stock (22 available)`).
  - `rating_text` (string): Word-based star rating (e.g. `Three`, `One`, `Five`).
  - `description` (string | null): Description paragraph or `null` if none exists on the page.
  - `source_page` (string, URL): Provenance URL of the catalogue page where the link was found.
  - `fetched_at` (string, ISO 8601): Provenance timestamp when the page was fetched.
- **Appropriateness**: Scraping a dedicated sandbox at a low request volume with rate limiting, timeouts, and disk caching causes zero disruption to real users or external production infrastructure.
- **Robots.txt Check**: A request to `https://books.toscrape.com/robots.txt` returned HTTP 404 (`no robots file found`). A missing robots file is not implicit permission on its own; permission is explicitly granted by the site's stated mission as a practice sandbox.

> **Permission & Compliance Statement**:
> "I will not reuse this code on another site without checking its rules and terms first."

---

## 2. Quickstart & Installation

### Prerequisites
- **Node.js**: version 20.0.0 or higher
- **npm**: version 9.0.0 or higher

### Installation & Run

```bash
# Clone the repository (if not already local)
git clone <repo-url>
cd scraper

# Install dependencies (cheerio, zod)
npm install

# Run the complete scraping pipeline
npm start
```

### Testing Resilience (Deliberate Broken URL)
To verify that the scraper survives a broken page without crashing and logs it in the run report:
```bash
node src/index.js --test-resilience
```

---

## 3. Record Schema

Records are normalized and strictly validated using **Zod** prior to persisting to `output/books.json`. Any failing records are quarantined to `output/errors.json`.

```typescript
{
  title: string;              // Required, non-empty string
  product_url: string;        // Required, valid URL starting with "https://"
  price_text: string;         // Required, original price string (e.g., "£51.77")
  price_gbp: number;          // Required, positive float (e.g., 51.77)
  availability_text: string;  // Required, cleaned stock string (e.g., "In stock (22 available)")
  rating_text: string;        // Rating indicator string (e.g., "Three")
  description: string | null; // Book synopsis or null if absent
  source_page: string;        // Required, catalogue page URL provenance
  fetched_at: string;         // Required, ISO 8601 UTC timestamp
}
```

---

## 4. Politeness Rules Followed

1. **Identifying User-Agent**: Every outgoing HTTP request includes an honest User-Agent header: `FlyRankInternship-A9/1.0 (+https://github.com/flyrank/scraper)`.
2. **Polite Delay**: Enforces at least 500ms delay between consecutive live HTTP network requests to prevent server stress. Cached local requests bypass delay.
3. **Request Timeout**: All network calls specify a 5000ms timeout (`AbortSignal.timeout(5000)`) so the program never hangs indefinitely.
4. **Local Disk Caching**: Raw HTML is saved locally in `cache/` (git-ignored). Repeated runs hit local disk cache instead of making unnecessary repeated network calls.
5. **Idempotency & Deduplication**: Canonical URLs are deduplicated. Re-running the scraper produces identical 60 records without duplication.
6. **Polite Retry Policy**: Network timeouts and 5xx server errors retry once after a delay; 404 (Not Found) and 403 (Forbidden) errors are never retried to avoid hammering the host.

---

## 5. Architectural Note: Why No Browser Was Needed

The data is already present directly inside the static HTML that the server sends. Spawning a headless browser (such as Chromium or Playwright) would only introduce significant CPU, memory, and startup latency overhead with zero functional benefit for this static server-rendered site.

---

## 6. Honest Limitations

- **Static HTML Dependency**: The scraper is built using Cheerio selector parsing and native fetch. If the target website transitions to client-side single page rendering (SPA) where content is rendered via JavaScript after load, Cheerio would be insufficient without a browser engine or API endpoint inspection.
- **Selector Fragility**: If the HTML structure or class names change (e.g. renaming `.product_page` or `.price_color`), selectors will need to be updated.

---

## 7. Ethics Note

- **API First**: Always prefer and use an official, documented API when one exists.
- **Respect Boundaries**: Never attempt to bypass authentication logins, paywalls, CAPTCHAs, or IP blocks.
- **Collect Responsibly**: Scrape only the data fields needed for the task, adhere to `robots.txt` directives, and always respect the host's rate limits and terms of service.

---

## 8. Run Report Evidence

Below is a real execution report generated by `src/reporter.js` and saved to `output/run-report.json`:

```json
{
  "start_time": "2026-09-05T07:18:45.517Z",
  "end_time": "2026-09-05T07:18:45.959Z",
  "duration_ms": 442,
  "duration_seconds": 0.44,
  "pages_fetched": 0,
  "cache_hits": 63,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0,
  "failed_urls": []
}
```
