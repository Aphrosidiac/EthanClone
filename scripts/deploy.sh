#!/usr/bin/env bash
#
# Deploy this demo to Cloudflare Pages: https://ff-frames.pages.dev
#
#   npm run deploy            # production
#   npm run deploy:preview    # preview branch, production untouched
#
# Same pattern as the other FF portfolio demos (ff-shoots, ff-search, ...): a DIRECT UPLOAD Pages
# project on Fakhrul's personal Cloudflare account, no git connection (wrangler ≥4.13x delegates
# "pages" to Workers unless --force), so pushing to GitHub deploys nothing — push and deploy are
# two acts. Credentials come from the FF brand repo's .env (CLOUDFLARE_API_TOKEN,
# CLOUDFLARE_ACCOUNT_ID). Every past deployment stays live at its own <id>.ff-frames.pages.dev.
#
# The build is ~3,800 files (the mirrored photography is most of it); Pages caps a deployment at
# 20,000 files and 25 MiB per file — both checked here before the upload starts.
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT="ff-frames"
BRANCH="${FF_BRANCH:-main}"
ENV_FILE="${FF_ENV:-$HOME/Desktop/dev/ffdevstudio/.env}"

[ -f "$ENV_FILE" ] || { echo "✗ no credentials at $ENV_FILE"; exit 1; }
set -a; . "$ENV_FILE"; set +a
: "${CLOUDFLARE_API_TOKEN:?missing in $ENV_FILE}"
: "${CLOUDFLARE_ACCOUNT_ID:?missing in $ENV_FILE}"

npm run build
files=$(find dist -type f | wc -l | tr -d ' ')
big=$(find dist -type f -size +25M | wc -l | tr -d ' ')
echo "dist: $files files, $big over 25 MiB"
[ "$files" -le 20000 ] && [ "$big" -eq 0 ] || { echo "✗ over Pages limits"; exit 1; }

npx --yes wrangler@latest pages project list 2>/dev/null | grep -q "│ $PROJECT " \
  || npx --yes wrangler@latest pages project create "$PROJECT" --production-branch main --force

npx --yes wrangler@latest pages deploy dist --project-name "$PROJECT" --branch "$BRANCH" --commit-dirty=true --force
