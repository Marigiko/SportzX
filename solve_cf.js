// solve_cf.js - Ejecutar en Windows con Node.js para resolver Cloudflare challenge
// Uso: npm init -y && npm i playwright && node solve_cf.js
const { chromium } = require('playwright');
const fs = require('fs');

const CAPTURE_FILE = 'captured_urls.jsonl';
const TARGETS = [
    'https://sportzx.com/api/events',
    'https://sportzx.com/events.json',
    'https://sportzx.com/eventCats.json',
];

async function main() {
    console.log('SportzX API Discovery - Windows Browser');
    console.log('======================================\n');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    // Solve CF on main page
    console.log('[1/3] Resolviendo Cloudflare challenge...');
    await page.goto('https://sportzx.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(8000);

    const title = await page.title();
    console.log(`  Page title: ${title}`);

    // Extract cookies
    const cookies = await context.cookies();
    fs.writeFileSync('cf_cookies.json', JSON.stringify(
        Object.fromEntries(cookies.map(c => [c.name, c.value])),
        null, 2
    ));
    console.log(`  Cookies: ${cookies.map(c => c.name).join(', ')}`);

    // Try API endpoints
    console.log('\n[2/3] Probando endpoints...');
    const results = {};
    
    for (const url of TARGETS) {
        try {
            const resp = await page.goto(url, { waitUntil: 'commit', timeout: 15000 });
            const body = await resp.body();
            const text = body.toString('utf-8');
            
            if (text.includes('Too many')) {
                console.log(`  ✗ ${url} → RATE LIMITED`);
                results[url] = { status: 429 };
            } else if (text.length > 50 && !text.includes('challenge')) {
                console.log(`  ✓ ${url} → ${text.length} bytes`);
                console.log(`    ${text.substring(0, 200)}...`);
                results[url] = { status: 200, size: text.length };
                
                // Save
                const fname = url.split('/').pop().replace('.json', '') + '_captured.json';
                fs.writeFileSync(fname, text);
                console.log(`    Guardado: ${fname}`);
            } else {
                console.log(`  ✗ ${url} → Challenge (${text.length} bytes)`);
                results[url] = { status: 200, challenged: true };
            }
        } catch (e) {
            console.log(`  ✗ ${url} → Error: ${e.message}`);
            results[url] = { error: e.message };
        }
        
        await page.waitForTimeout(2000);
    }

    // Summary
    console.log('\n[3/3] Resumen:');
    const ok = Object.entries(results).filter(([, r]) => r.size > 50);
    const rl = Object.entries(results).filter(([, r]) => r.status === 429);
    
    if (ok.length > 0) {
        console.log(`\n  ✓ Endpoints exitosos: ${ok.length}`);
        ok.forEach(([u]) => console.log(`    ${u}`));
    }
    if (rl.length > 0) {
        console.log(`\n  ✗ Rate limited: ${rl.length}`);
        console.log('    → Cambia servidor de Proton VPN y reintentar');
    }

    await browser.close();
    
    fs.appendFileSync(CAPTURE_FILE, JSON.stringify({
        timestamp: new Date().toISOString(),
        results
    }) + '\n');
    
    console.log(`\n  Resultados en: ${CAPTURE_FILE}`);
}

main().catch(console.error);
