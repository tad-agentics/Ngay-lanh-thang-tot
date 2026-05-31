#!/usr/bin/env bash
# Post–DeepSeek rollout: remove legacy Gemini Edge secrets + set VITE_SENTRY_DSN on Vercel.
# Prerequisites: `npx supabase login` and `npx vercel login` (tokens must be valid).
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-hptovpbiwvtngorhdhhm}"
VERCEL_PROJECT="${VERCEL_PROJECT:-ngay-lanh-thang-tot}"

echo "==> Supabase: remove Gemini secrets (project ${PROJECT_REF})"
for name in GEMINI_API_KEY GEMINI_MODEL GEMINI_THINKING_BUDGET; do
  if npx supabase secrets unset "$name" --project-ref "$PROJECT_REF"; then
    echo "    removed ${name}"
  else
    echo "    failed ${name} — run: npx supabase login (needs sbp_… token)"
    exit 1
  fi
done

echo ""
echo "==> Vercel: set VITE_SENTRY_DSN (project ${VERCEL_PROJECT})"
if [[ -z "${VITE_SENTRY_DSN:-}" ]]; then
  echo "    Set VITE_SENTRY_DSN to your Sentry DSN, then re-run:"
  echo "    VITE_SENTRY_DSN='https://…@….ingest.sentry.io/…' $0"
  exit 1
fi

printf '%s' "$VITE_SENTRY_DSN" | npx vercel env add VITE_SENTRY_DSN production \
  --project "$VERCEL_PROJECT" \
  --yes

echo ""
echo "Done. Redeploy production if env was added (or wait for next push)."
