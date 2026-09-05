import { z } from "zod";

/**
 * Zod schema for validated book records.
 */
export const BookRecordSchema = z.object({
  title: z.string().min(1, "Title is required"),
  product_url: z
    .string()
    .url("product_url must be a valid URL")
    .refine((url) => url.startsWith("https://"), {
      message: "product_url must start with https://",
    }),
  price_text: z.string().min(1, "price_text is required"),
  price_gbp: z.number().positive("price_gbp must be a positive number"),
  availability_text: z.string().min(1, "availability_text is required"),
  rating_text: z.string(),
  description: z.string().nullable(),
  source_page: z
    .string()
    .url("source_page must be a valid URL")
    .refine((url) => url.startsWith("https://"), {
      message: "source_page must start with https://",
    }),
  fetched_at: z.string().datetime({ message: "fetched_at must be an ISO 8601 datetime string" }),
});

export const ErrorRecordSchema = z.object({
  record: z.any(),
  errors: z.array(z.string()),
  failed_at: z.string().datetime(),
});
