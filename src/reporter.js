import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "output");

export class ScrapeReporter {
  constructor() {
    this.startTime = null;
    this.endTime = null;
    this.pagesFetched = 0;
    this.cacheHits = 0;
    this.validRecords = 0;
    this.invalidRecords = 0;
    this.failedPages = 0;
    this.failedUrls = [];
  }

  start() {
    this.startTime = new Date();
  }

  recordFetch(fromCache) {
    if (fromCache) {
      this.cacheHits++;
    } else {
      this.pagesFetched++;
    }
  }

  recordValidation(isValid) {
    if (isValid) {
      this.validRecords++;
    } else {
      this.invalidRecords++;
    }
  }

  recordFailure(url, error) {
    this.failedPages++;
    this.failedUrls.push({
      url,
      error: error?.message || String(error),
      timestamp: new Date().toISOString(),
    });
  }

  async finishAndSave() {
    this.endTime = new Date();
    const durationMs = this.endTime.getTime() - (this.startTime?.getTime() || this.endTime.getTime());

    const report = {
      start_time: this.startTime?.toISOString() || this.endTime.toISOString(),
      end_time: this.endTime.toISOString(),
      duration_ms: durationMs,
      duration_seconds: +(durationMs / 1000).toFixed(2),
      pages_fetched: this.pagesFetched,
      cache_hits: this.cacheHits,
      valid_records: this.validRecords,
      invalid_records: this.invalidRecords,
      failed_pages: this.failedPages,
      failed_urls: this.failedUrls,
    };

    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const reportPath = path.join(OUTPUT_DIR, "run-report.json");
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");

    return report;
  }
}
