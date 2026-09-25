#!/usr/bin/env python3
"""
mitmproxy addon to capture and log all URLs requested by SportzX.
Usage: mitmdump -s capture_urls.py -p 8080
"""

import json
import os
from datetime import datetime

CAPTURE_FILE = os.path.join(os.path.dirname(__file__), "captured_urls.jsonl")


class SportzCapture:
    def __init__(self):
        self.urls = []
        print(f"[*] URL capture started. Logging to {CAPTURE_FILE}")

    def request(self, flow):
        url = flow.request.pretty_url
        method = flow.request.method
        host = flow.request.pretty_host

        # Log all requests
        entry = {
            "timestamp": datetime.now().isoformat(),
            "method": method,
            "url": url,
            "host": host,
            "headers": dict(flow.request.headers),
        }

        # Include POST body if present
        if flow.request.content:
            try:
                entry["body"] = flow.request.content.decode("utf-8", errors="replace")[:2000]
            except Exception:
                pass

        with open(CAPTURE_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")

        # Highlight potentially interesting URLs
        interesting = ["event", "channel", "cat", "stream", "api", "json", "m3u8", "mpd", "config", "ads"]
        if any(kw in url.lower() for kw in interesting):
            print(f"\n[★] {method} {url}")
            for k, v in flow.request.headers.items():
                print(f"    {k}: {v}")
        else:
            print(f"    {method} {url}")


addons = [SportzCapture()]
