import { chromium } from "playwright";

const URL = process.env.URL ?? "http://localhost:5180/";
const OUT = process.env.OUT ?? "public/og-image.png";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({
  viewport: { width: 2400, height: 1260 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: "networkidle" });

// Hide everything past the hero/demo section so the OG image shows only the hero.
await page.addStyleTag({
  content: `
    main > div { display: none !important; }
    footer { display: none !important; }
  `,
});

// Streaming sequence: root (~5s) → branch-left (~5s) → branch (~5s). Wait long
// enough for all three cards to fully render.
await page.waitForTimeout(18000);

await page.screenshot({ path: OUT, fullPage: false });

await browser.close();
console.log(`wrote ${OUT}`);
