import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/** Forwarding proxy to Bát Tự API — implement op allowlist + credits in Wave 2. */
Deno.serve((_req) => {
  return new Response(
    JSON.stringify({
      ok: false,
      error: { code: "STUB", message: "bat-tu Edge not implemented yet" },
    }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    },
  );
});
