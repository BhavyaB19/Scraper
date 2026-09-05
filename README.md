# The Polite Scraper (FlyRank Assignment A9)

A small, polite web scraping pipeline built in JavaScript (Node.js 20+) using Cheerio, native Fetch, and Zod. It downloads the first three catalogue pages of **Books to Scrape**, visits all 60 book pages, normalizes and validates data into schema-checked JSON records, survives broken pages without crashing, and generates an honest run report.

## Target Classification

- **Target Site**: Books to Scrape (`https://books.toscrape.com/`)
- **Why**: Books to Scrape is an official public sandbox website created specifically for scraping practice and educational automation.
- **Scope / How Much**: Exactly the first 3 catalogue pages (`catalogue/page-1.html` to `catalogue/page-3.html`), discovering and extracting 60 unique book detail pages.
- **Data Collected**:
  - `title`: Book title
  - `product_url`: Canonical absolute URL
  - `price_text`: Raw price string (e.g. `£51.77`)
  - `price_gbp`: Cleaned numeric price in GBP (e.g. `51.77`)
  - `availability_text`: Stock status string (e.g. `In stock (22 available)`)
  - `rating_text`: Star rating text (e.g. `Three`)
  - `description`: Book description or `null` if omitted
  - `source_page`: Provenance URL of catalogue page where discovered
  - `fetched_at`: Provenance ISO 8601 timestamp
- **Appropriateness**: Scraping a dedicated sandbox environment at a minimal volume (60 books), using polite delay headers, a custom user agent, disk caching, and rate limiting ensures safe, responsible data collection.
- **Robots.txt Check**: A request to `https://books.toscrape.com/robots.txt` returned HTTP 404 (`no robots file found`). A missing file is not permission by itself; permission is granted by the site's explicit purpose as a public practice sandbox.

> **Permission & Ethics Commitment**:
> "I will not reuse this code on another site without checking its rules and terms first."

---

## Quickstart

```bash
# Install dependencies
npm install

# Run the scraping pipeline
npm start
```
