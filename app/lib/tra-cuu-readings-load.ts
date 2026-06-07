import { invokeGenerateReadingWithRetry } from "~/lib/generate-reading";

/** NLTT intro bubble after successful `chon-ngay` pick. */
export async function loadTraCuuIntroReading(payload: unknown): Promise<string | null> {
  const res = await invokeGenerateReadingWithRetry({
    endpoint: "chon-ngay",
    data: payload,
  });
  const text = res.reading?.trim();
  return text || null;
}
