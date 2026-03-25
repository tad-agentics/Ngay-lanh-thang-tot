import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/** PayOS checkout URL — implement order insert + redirect in W1. */
Deno.serve((_req) => {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code: "STUB",
        message: "payos-create-checkout not implemented yet",
      },
    }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    },
  );
});
