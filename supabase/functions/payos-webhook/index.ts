import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/** PayOS webhook — verify signature, idempotency, profile update in W1. */
Deno.serve((_req) => {
  return new Response(
    JSON.stringify({
      ok: false,
      error: { code: "STUB", message: "payos-webhook not implemented yet" },
    }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    },
  );
});
