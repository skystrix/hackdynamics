#!/bin/sh
# Pack the course data, then deploy course-content. Always deploy through this script:
# the function serves whatever _packed.ts holds, so deploying without packing ships stale text.
set -e
cd "$(dirname "$0")/.."
node tools/pack-content.mjs
supabase functions deploy course-content "$@"
