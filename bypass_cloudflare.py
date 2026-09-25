#!/usr/bin/env python3
"""
Bypass Cloudflare JS Challenge on sportzx.com using Playwright,
capture all network requests to find the API endpoints.
"""
import asyncio
from playwright.async_api import async_playwright
import json

URLS_TO_TEST = [
    "https://sportzx.com/events.json",
    "https://sportzx.com/api/events",
    "https://sportzx.com/api/v1/events",
    "https://sportzx.com/eventCats.json",
]

API_REQUESTS = []

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Linux; Android 7.1.1; ONEPLUS A5000) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.0.0 Mobile Safari/537.36"
        )

        # Capture ALL network requests
        page = await context.new_page()
        page.on("request", lambda req: handle_request(req))
        page.on("response", lambda resp: handle_response(resp))

        for url in URLS_TO_TEST:
            print(f"\n=== Testing: {url} ===")
            try:
                resp = await page.goto(url, wait_until="networkidle", timeout=20000)
                await page.wait_for_timeout(3000)
                # Get page content (might be the actual API response)
                content = await page.content()
                if "Loading" not in content or "challenge" not in content.lower():
                    print(f"  Possible success! Content length: {len(content)}")
                    # Try to get as JSON
                    try:
                        text = await page.inner_text("pre")
                        if text:
                            print(f"  JSON: {text[:500]}")
                    except:
                        pass
            except Exception as e:
                print(f"  Error: {e}")

        # Also try the original app-like URL patterns
        app_urls = [
            "https://sportzx.com/api/events.json",
            "https://sportzx.com/api/v1/channels/soccer.json",
            "https://sportzx.com/api/cats/1",
        ]
        for url in app_urls:
            print(f"\n=== App URL: {url} ===")
            try:
                resp = await page.goto(url, wait_until="networkidle", timeout=15000)
                await page.wait_for_timeout(2000)
                try:
                    text = await page.inner_text("pre")
                    if text:
                        print(f"  Content: {text[:500]}")
                except:
                    pass
            except Exception as e:
                print(f"  Error: {e}")

        await browser.close()

        # Summary
        print("\n=== API REQUESTS CAPTURED ===")
        seen = set()
        for req in API_REQUESTS:
            url = req['url']
            if url not in seen and ('json' in url or 'event' in url or 'api' in url or 'cat' in url or 'channel' in url):
                seen.add(url)
                print(f"  {req['method']} {url}")

def handle_request(req):
    API_REQUESTS.append({
        'method': req.method,
        'url': req.url,
        'headers': dict(req.headers)
    })

def handle_response(resp):
    url = resp.url
    if any(kw in url.lower() for kw in ['json', 'event', 'api', 'cat', 'channel', 'stream']):
        print(f"  [RESP] {resp.status} {url}")

asyncio.run(main())
