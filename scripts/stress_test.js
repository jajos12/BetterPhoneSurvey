
const puppeteer = require('puppeteer');

// Config
const CONCURRENT_USERS = 5; // Start small to not crash your dev machine
const BASE_URL = 'http://localhost:3000/survey/pain-check';
const HEADLESS = false; // Set to false to WATCH the chaos happen!

async function runUserSession(id) {
    const browser = await puppeteer.launch({
        headless: HEADLESS,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=375,812']
    });
    const page = await browser.newPage();

    // Simulate mobile viewport
    await page.setViewport({ width: 375, height: 812 });

    try {
        console.log(`[User ${id}] Starting journey...`);

        // Helper to click content safely
        const clickText = async (text, selector = 'button, span, div, label') => {
            try {
                // Wait for element with text to appear in DOM
                await page.waitForFunction(
                    (text, selector) => {
                        const elements = Array.from(document.querySelectorAll(selector));
                        return elements.some(el => el.textContent.includes(text));
                    },
                    { timeout: 5000 },
                    text,
                    selector
                );

                // Find and click
                await page.evaluate((text, selector) => {
                    const elements = Array.from(document.querySelectorAll(selector));
                    // Find the most specific element (shortest text length that still matches) to avoid clicking containers
                    const matches = elements.filter(el => el.textContent.includes(text));
                    const target = matches.sort((a, b) => a.textContent.length - b.textContent.length)[0];
                    if (target) target.click();
                }, text, selector);

            } catch (e) {
                console.error(`[User ${id}] Failed to find text "${text}"`);
                throw e; // Rethrow to stop this user's flow
            }
        };

        // Helper: Random delay
        const delay = (ms) => new Promise(r => setTimeout(r, ms));

        // 1. Visit Gate
        await page.goto(BASE_URL);

        // Gate
        console.log(`[User ${id}] Gate`);
        // Note: The text is "Yes, this is a regular source of stress and problems"
        // We match a unique part of it.
        await clickText("regular source of stress");

        // Email (Wait for redirect)
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log(`[User ${id}] Email`);
        await page.type('input[type="email"]', `stress_test_${id}_${Date.now()}@example.com`);
        await clickText("Claim My $100 Reward");

        // Step 1: Voice
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log(`[User ${id}] Step 1`);
        // Wait for textarea to ensure page is interactive
        await page.waitForSelector('textarea');
        await page.type('textarea', "This is a simulated stress test response.");
        await clickText("Continue");

        // Step 2: Checkboxes
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log(`[User ${id}] Step 2`);
        const checkboxes = await page.$$('input[type="checkbox"]');
        if (checkboxes.length > 0) {
            // Click random number of checkboxes
            const count = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < count; i++) {
                // Check if checkbox is visible/clickable
                try {
                    await checkboxes[i].click();
                } catch (err) { /* ignore hidden ones */ }
            }
        }
        await clickText("Continue");

        // Step 3: Ranking (Hard to simulate dnd efficiently, just verify load and continue)
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log(`[User ${id}] Step 3 (Ranking)`);
        await delay(1000); // Simulate "thinking"
        await clickText("Continue");

        console.log(`[User ${id}] ✅ Reached mid-point successfully`);

    } catch (e) {
        console.error(`[User ${id}] ❌ CRASH/ERROR:`, e.message);
        try {
            await page.screenshot({ path: `error_user_${id}.png` });
        } catch (err) {
            console.error("Could not take screenshot");
        }
    } finally {
        await browser.close();
    }
}

// Run the swarm
(async () => {
    console.log(`🚀 Launching ${CONCURRENT_USERS} concurrent users...`);
    const promises = [];
    for (let i = 0; i < CONCURRENT_USERS; i++) {
        promises.push(runUserSession(i));
        // Stagger slightly really hits the race conditions better than perfect sync
        await new Promise(r => setTimeout(r, 800));
    }

    await Promise.all(promises);
    console.log("🏁 Stress test complete.");
})();
