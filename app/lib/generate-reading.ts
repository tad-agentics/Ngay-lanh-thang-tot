import { supabase } from "~/lib/supabase";

export type GenerateReadingInput = {
  endpoint: string;
  data: unknown;
};

export type GenerateReadingResponse = { reading: string | null };

/**
 * Gọi Edge `generate-reading` — luôn an toàn: EF trả 200 + reading null khi lỗi.
 */
export async function invokeGenerateReading(
  input: GenerateReadingInput,
): Promise<GenerateReadingResponse> {
  try {
    const { data, error } =
      await supabase.functions.invoke<GenerateReadingResponse>("generate-reading", {
        body: input,
      });
    if (error) return { reading: null };
    if (data && typeof data === "object" && "reading" in data) {
      const r = (data as GenerateReadingResponse).reading;
      if (typeof r === "string" && r.trim()) return { reading: r.trim() };
      return { reading: null };
    }
    return { reading: null };
  } catch {
    return { reading: null };
  }
}
