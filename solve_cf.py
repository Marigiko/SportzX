#!/usr/bin/env python3
"""
Solve Cloudflare challenge by waiting for it to complete automatically,
then extract the API content.
"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)  # Full browser (not headless) solves CF
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        print("=== Solving Cloudflare for sportzx.com/api/events ===")
        try:
            # Cloudflare JS challenge takes ~5-10s to solve
            resp = await page.goto("https://sportzx.com/events.json", wait_until="networkidle", timeout=30000)
            # Wait extra for challenge to resolve
            await page.wait_for_timeout(5000)
            
            # Check if we passed the challenge
            content = await page.content()
            if "challenge" not in content.lower() and "loading" not in content.lower()[:200].lower():
                print("✓ Challenge solved!")
                # Try to get the actual data
                try:
                    text = await page.inner_text("body")
                    print(f"Content: {text[:2000]}")
                except:
                    print(f"Full content: {content[:1000]}")
                
                # Also dump cookies for reuse
                cookies = await context.cookies()
                print("\n=== Cookies ===")
                for c in cookies:
                    if 'cf' in c['name'].lower() or 'sid' in c['name'].lower():
                        print(f"  {c['name']}={c['value']}")
            else:
                print("✗ Still facing challenge")
                print(f"Page: {content[:500]}")
        except Exception as e:
            print(f"Error: {e}")

        # Also try direct data endpoints
        print("\n=== Trying /api/events ===")
        try:
            await page.goto("https://sportzx.com/api/events", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(3000)
            text = await page.inner_text("body")
            print(f"Content: {text[:2000]}")
        except Exception as e:
            print(f"Error: {e}")

        await browser.close()

asyncio.run(main())
