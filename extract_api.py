#!/usr/bin/env python3
"""
Extract actual content from sportzx.com API endpoints
"""
import asyncio
from playwright.async_api import async_playwright

URLS = [
    "https://sportzx.com/events.json",
    "https://sportzx.com/api/events",
    "https://sportzx.com/api/v1/events",
    "https://sportzx.com/eventCats.json",
    "https://sportzx.com/api/events.json",
    "https://sportzx.com/api/channels/soccer.json",
    "https://sportzx.com/api/cats/1",
    "https://sportzx.com/api/categories",
    "https://sportzx.com/api",
    "https://sportzx.com/api/v1",
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
        )

        page = await context.new_page()

        for url in URLS:
            print(f"\n=== {url} ===")
            try:
                resp = await page.goto(url, wait_until="commit", timeout=15000)
                # Get response body
                body = await resp.body()
                text = body.decode('utf-8', errors='replace')[:1000]
                print(f"  Status: {resp.status}")
                print(f"  Content-Type: {resp.headers.get('content-type', 'unknown')}")
                print(f"  Body: {text}")
            except Exception as e:
                print(f"  Error: {e}")

        await browser.close()

asyncio.run(main())
