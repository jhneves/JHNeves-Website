#!/usr/bin/env bash
# Mirror the Wingman teaser into this site so `jhweb site build` can publish it
# under /wingman. Built bundle -> ./wingman ; Pages Functions -> ./functions.
#
# The teaser repo builds itself: `npm run build` there bundles every ES module
# into one minified file and writes a minified index.html beside it, in dist/.
# We copy that, never the source tree, so the live site exposes no readable
# engine/shader code and no dev-only file (serve.py, tools/, the audio master,
# node_modules) can leak into a deploy.
#
# Run this after iterating in the Wingman-Site repo, then `./jhweb site upload`.
set -euo pipefail
SRC="${1:-/Users/joaoneves/Development/Projects/Wingman-Site}"
DEST_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

[ -f "$SRC/index.html" ] || { echo "Wingman source not found at: $SRC" >&2; exit 1; }

echo "Building the teaser bundle in $SRC ..."
(cd "$SRC" && npm run --silent build)

[ -f "$SRC/dist/index.html" ] || { echo "Build produced no dist/index.html" >&2; exit 1; }

# Built teaser -> /wingman. dist/ holds only index.html, the content-hashed bundle,
# and the two runtime assets, so there is nothing here worth excluding.
rsync -a --delete "$SRC/dist/" "$DEST_ROOT/wingman/"

# Pages Functions (capture API) -> ./functions (served at site root: /api/*)
rsync -a "$SRC/functions/" "$DEST_ROOT/functions/"

echo "Synced Wingman teaser from $SRC"
echo "  static   -> $DEST_ROOT/wingman/"
echo "  functions-> $DEST_ROOT/functions/"
