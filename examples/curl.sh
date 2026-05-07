#!/usr/bin/env sh
set -eu

: "${RM_APP_ID:?Set RM_APP_ID}"
: "${RM_APP_SECRET:?Set RM_APP_SECRET}"

BASE_URL="${RM_BASE_URL:-https://retentionmaster.io/api/v1}"
TOKEN="${RM_APP_ID}.${RM_APP_SECRET}"

curl -sS -H "Authorization: Bearer ${TOKEN}" "${BASE_URL}/me"
curl -sS -H "Authorization: Bearer ${TOKEN}" "${BASE_URL}/sites"
curl -sS -H "Authorization: Bearer ${TOKEN}" "${BASE_URL}/events?period=last7&limit=25"
curl -sS -H "Authorization: Bearer ${TOKEN}" "${BASE_URL}/leads?period=last7&limit=25"
curl -sS -H "Authorization: Bearer ${TOKEN}" "${BASE_URL}/summary?period=mtd"
