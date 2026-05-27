#!/usr/bin/env bash
# Direction B forbidden-pattern gate.
# Run in CI (or pre-commit) to catch design-system violations before they ship.
# Exit 1 if any violation found.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
SRC="$ROOT/app"
ERRORS=0

fail() {
  echo "FAIL: $1"
  echo "  → $2"
  ERRORS=$((ERRORS + 1))
}

echo "Direction B/C forbidden-pattern check..."

# Direction C: no consumer-facing "lượng" / credit-wallet copy in new route tree
LUONG_HITS=$(grep -rl 'lượng\|mua lượng\|Mua lượng' "$ROOT/app/routes" \
  --include='lich*.tsx' --include='tra-cuu*.tsx' --include='toi*.tsx' \
  --include='dat-lich*.tsx' --include='gio-sinh.tsx' --include='splash.tsx' \
  2>/dev/null || true)
if [ -n "$LUONG_HITS" ]; then
  fail "credit-wallet copy in Direction C routes" \
    "Remove lượng/mua lượng strings from: $LUONG_HITS"
fi

# 1. text-gold on bg-paper (or vice versa) — gold fails contrast on paper
# Heuristic: any file that contains BOTH "text-gold" (not "text-gold-deep") AND "bg-paper"
while IFS= read -r file; do
  if grep -q 'text-gold[^-]' "$file" && grep -q 'bg-paper' "$file"; then
    fail "text-gold on bg-paper in $file" \
      "Use text-gold-deep (4.90:1) for text on paper. text-gold (#c5a55a) is for dividers/watermarks only."
  fi
done < <(grep -rl 'text-gold' "$SRC" --include='*.tsx' --include='*.ts' --include='*.css' 2>/dev/null || true)

# 2. text-gold-deep on bg-forest — fails contrast on forest (use text-gold instead)
while IFS= read -r file; do
  if grep -q 'text-gold-deep' "$file" && grep -q 'bg-forest' "$file"; then
    fail "text-gold-deep on bg-forest in $file" \
      "Use text-gold (#c5a55a) for text on forest. text-gold-deep is for paper surfaces."
  fi
done < <(grep -rl 'text-gold-deep' "$SRC" --include='*.tsx' --include='*.ts' --include='*.css' 2>/dev/null || true)

# 3. Tailwind gradient backgrounds — no gradients allowed
if grep -r 'bg-gradient-' "$SRC" --include='*.tsx' --include='*.ts' -l 2>/dev/null | grep -v 'node_modules'; then
  fail "bg-gradient-* found" \
    "No gradient backgrounds. Use solid bg-paper or bg-forest only (FE-HANDOFF §7)."
fi

# 4. Rounded cards with left-border accents — the Ticket IS the card
if grep -r 'rounded-' "$SRC" --include='*.tsx' -l 2>/dev/null | \
   xargs grep -l 'border-l-' 2>/dev/null | grep -v 'node_modules' | head -5; then
  echo "WARN: Files with both rounded-* and border-l-* — check if these are 'cards' (should use Ticket) or legitimate use (e.g. code blocks, progress bars)."
fi

# 5. Theme toggle — not allowed (light is default, forest is per-screen)
if grep -r 'theme.*toggle\|toggleTheme\|setTheme\|ThemeToggle\|dark.*mode.*toggle' "$SRC" --include='*.tsx' --include='*.ts' -l 2>/dev/null | grep -v 'node_modules'; then
  fail "Theme toggle found" \
    "No theme toggle. Light is app default; forest is per-screen, not per-user (FE-HANDOFF §7)."
fi

# 6. ExploreSheetModal re-introduction
if grep -r 'ExploreSheetModal' "$SRC" --include='*.tsx' --include='*.ts' -l 2>/dev/null | grep -v 'node_modules'; then
  fail "ExploreSheetModal found" \
    "Explore sheet is retired. Every Explore destination has a tab home (FE-HANDOFF §7)."
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "FAILED: $ERRORS forbidden pattern(s) found."
  exit 1
else
  echo "PASSED: No forbidden patterns found."
  exit 0
fi
