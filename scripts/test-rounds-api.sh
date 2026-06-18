#!/usr/bin/env bash
# Test interview rounds API locally.
# Usage:
#   export CLERK_TOKEN="eyJ..."   # from browser (see below)
#   export OPP_ID="uuid-here"     # internship opportunity id
#   bash scripts/test-rounds-api.sh
#
# Get CLERK_TOKEN (signed in at http://localhost:3000):
#   DevTools → Console → paste:
#   copy(await window.Clerk.session.getToken())
#
# Get OPP_ID:
#   curl -s -H "Authorization: Bearer $CLERK_TOKEN" http://localhost:3001/api/opportunities | jq '.[0].id'

set -euo pipefail

API="${API_URL:-http://localhost:3001/api}"
TOKEN="${CLERK_TOKEN:-}"
OPP_ID="${OPP_ID:-}"

if [[ -z "$TOKEN" ]]; then
  echo "Error: Set CLERK_TOKEN first."
  echo '  export CLERK_TOKEN="$(pbpaste)"   # after copy(await window.Clerk.session.getToken())'
  exit 1
fi

if [[ -z "$OPP_ID" ]]; then
  echo "Fetching your opportunities to pick an internship..."
  LIST=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/opportunities")
  OPP_ID=$(echo "$LIST" | node -e "
    const rows = JSON.parse(require('fs').readFileSync(0,'utf8'));
    const internship = rows.find((r) => r.category === 'internship');
    if (!internship) { process.exit(1); }
    console.log(internship.id);
  " 2>/dev/null) || {
    echo "Error: No internship found. Create one in the app or set OPP_ID manually."
    exit 1
  }
  echo "Using OPP_ID=$OPP_ID"
fi

echo ""
echo "=== GET rounds ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  "$API/opportunities/$OPP_ID/rounds" | node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(0,'utf8')), null, 2))"

echo ""
echo "=== POST round (OA, pending) ==="
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"round_type":"oa","result":"pending","notes":"API smoke test"}' \
  "$API/opportunities/$OPP_ID/rounds" | node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(0,'utf8')), null, 2))"

echo ""
echo "=== GET rounds (after create) ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  "$API/opportunities/$OPP_ID/rounds" | node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(0,'utf8')), null, 2))"

echo ""
echo "Done."
