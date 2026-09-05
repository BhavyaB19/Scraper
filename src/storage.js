import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "output");

/**
 * Saves validated records and errors to the output directory.
 * Deduplicates records by product_url (canonical identity) to ensure idempotency.
 * 
 * @param {Array<object>} validRecords 
 * @param {Array<object>} errorRecords 
 */
export async function saveOutputs(validRecords, errorRecords = []) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Deduplicate by canonical product_url
  const recordMap = new Map();
  for (const record of validRecords) {
    recordMap.set(record.product_url, record);
  }
  const deduplicatedRecords = Array.from(recordMap.values());

  const booksPath = path.join(OUTPUT_DIR, "books.json");
  const errorsPath = path.join(OUTPUT_DIR, "errors.json");

  await fs.writeFile(booksPath, JSON.stringify(deduplicatedRecords, null, 2), "utf-8");
  await fs.writeFile(errorsPath, JSON.stringify(errorRecords, null, 2), "utf-8");

  return {
    booksFile: booksPath,
    errorsFile: errorsPath,
    recordCount: deduplicatedRecords.length,
    errorCount: errorRecords.length,
  };
}
