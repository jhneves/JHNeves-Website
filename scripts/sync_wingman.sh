#!/usr/bin/env bash
# Mirror the Wingman teaser into this site so `jhweb site build` can publish it
# under /wingman. Static files -> ./wingman ; Pages Functions -> ./functions.
# Run this after iterating in the Wingman-Site repo, then `./jhweb site upload`.
set -euo pipefail
SRC="${1:-/Users/joaoneves/Development/Projects/Wingman-Site}"
DEST_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

[ -f "$SRC/index.html" ] || { echo "Wingman source not found at: $SRC" >&2; exit 1; }

# Static teaser -> /wingman (exclude dev/server-only files and the functions dir)
rsync -a --delete \
  --exclude='.git' --exclude='.DS_Store' --exclude='.wrangler' \
  --exclude='functions' --exclude='tools' --exclude='serve.py' \
  --exclude='wrangler.toml' --exclude='package.json' --exclude='*.mid' --exclude='*.orig.*' \
  "$SRC/" "$DEST_ROOT/wingman/"

# Pages Functions (capture API) -> ./functions (served at site root: /api/*)
rsync -a "$SRC/functions/" "$DEST_ROOT/functions/"

echo "Synced Wingman teaser from $SRC"
echo "  static   -> $DEST_ROOT/wingman/"
echo "  functions-> $DEST_ROOT/functions/"
