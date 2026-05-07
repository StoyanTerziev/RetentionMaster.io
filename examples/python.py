#!/usr/bin/env python3
import json
import os
import sys
import urllib.error
import urllib.request


BASE_URL = os.environ.get("RM_BASE_URL", "https://retentionmaster.io/api/v1").rstrip("/")
APP_ID = os.environ.get("RM_APP_ID")
APP_SECRET = os.environ.get("RM_APP_SECRET")


if not APP_ID or not APP_SECRET:
    sys.stderr.write("Set RM_APP_ID and RM_APP_SECRET\n")
    sys.exit(1)


def rm_get(path):
    request = urllib.request.Request(
        f"{BASE_URL}{path}",
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {APP_ID}.{APP_SECRET}",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"RetentionMaster API request failed: {body}") from exc

    if payload.get("ok") is False:
        raise RuntimeError(payload.get("error") or "RetentionMaster API request failed")

    return payload


print(json.dumps(rm_get("/me"), indent=2))
print(json.dumps(rm_get("/events?period=last7&limit=25"), indent=2))
print(json.dumps(rm_get("/leads?period=last7&limit=25"), indent=2))
print(json.dumps(rm_get("/summary?period=mtd"), indent=2))
