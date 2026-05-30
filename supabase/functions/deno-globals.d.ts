/**
 * Khai báo tối thiểu cho `Deno` — phục vụ TypeScript trong IDE (tsserver).
 * Runtime thực tế là Supabase Edge (Deno). Chi tiết đầy đủ: Deno + import map trong deno.json.
 */
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void;
};

declare module "npm:@supabase/supabase-js@2.49.1" {
  export * from "@supabase/supabase-js";
}