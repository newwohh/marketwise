#!/usr/bin/env python3
"""Configure only the requested Marketwise CNAME using a zone-scoped API token.

Reads CLOUDFLARE_API_TOKEN from the environment, never prints credentials, and
defaults to a read-only plan. --apply performs the already-requested DNS change.
Conflicting record types are reported rather than deleted.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

ZONE = "bynevin.dev"
HOSTNAME = "marketwise.bynevin.dev"
# Exact rank-1 recommendation returned by Vercel for the Marketwise project.
TARGET = "bb35a45b288b0bc0.vercel-dns-017.com"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    if not token:
        sys.exit("Missing CLOUDFLARE_API_TOKEN. Add it through secure environment settings.")

    def api(method, path, body=None):
        request = urllib.request.Request(
            "https://api.cloudflare.com/client/v4" + path,
            method=method,
            headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
            data=json.dumps(body).encode() if body is not None else None,
        )
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                payload = json.load(response)
        except urllib.error.HTTPError as error:
            sys.exit(f"Cloudflare returned HTTP {error.code}. Check token permissions and zone scope.")
        except (urllib.error.URLError, TimeoutError):
            sys.exit("Cloudflare request failed. Reconcile the record before retrying a write.")
        if not payload.get("success"):
            codes = [str(item.get("code", "unknown")) for item in payload.get("errors", [])]
            sys.exit("Cloudflare rejected the request. Error codes: " + ", ".join(codes))
        return payload

    zones = api("GET", "/zones?" + urllib.parse.urlencode({"name": ZONE, "status": "active", "per_page": 50}))["result"]
    zones = [zone for zone in zones if zone["name"] == ZONE]
    if len(zones) != 1:
        sys.exit("Expected exactly one accessible active bynevin.dev zone; no DNS changes made.")
    zone_id = urllib.parse.quote(zones[0]["id"], safe="")
    path = f"/zones/{zone_id}/dns_records"
    result = api("GET", path + "?" + urllib.parse.urlencode({"name": HOSTNAME, "per_page": 100}))
    if result.get("result_info", {}).get("total_pages", 1) > 1:
        sys.exit("Unexpected record count; no DNS changes made.")
    records = result["result"]
    if any(record["name"] != HOSTNAME for record in records):
        sys.exit("Unexpected DNS response; no changes made.")
    if any(record["type"] != "CNAME" for record in records) or len(records) > 1:
        sys.exit("Conflicting records exist at marketwise.bynevin.dev. No records deleted or changed.")

    desired = {"type": "CNAME", "name": HOSTNAME, "content": TARGET, "proxied": False, "ttl": 1}
    existing = records[0] if records else None
    matches = existing and existing["content"].lower().rstrip(".") == TARGET and existing.get("proxied") is False and existing.get("ttl") == 1
    action = "unchanged" if matches else "update" if existing else "create"
    print(json.dumps({"action": action, "zone": ZONE, "record": desired, "apply": args.apply}))
    if not args.apply or matches:
        return
    if existing:
        record_id = urllib.parse.quote(existing["id"], safe="")
        # Patch only the target and DNS settings; preserve comments and record metadata.
        api("PATCH", path + "/" + record_id, {"content": TARGET, "proxied": False, "ttl": 1})
    else:
        api("POST", path, desired)
    confirmed = api("GET", path + "?" + urllib.parse.urlencode({"name": HOSTNAME, "type": "CNAME"}))["result"]
    if len(confirmed) != 1 or confirmed[0]["content"].lower().rstrip(".") != TARGET or confirmed[0].get("proxied") is not False:
        sys.exit("Write submitted but verification did not match. Inspect the record before retrying.")
    print("Confirmed: Marketwise CNAME configured in Cloudflare. DNS propagation and HTTPS still need checking.")


if __name__ == "__main__":
    main()
