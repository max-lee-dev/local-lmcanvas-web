import { chromium } from "playwright";

const URL = process.env.URL ?? "http://localhost:5180/";
const OUT = process.env.OUT ?? "public/og-image.png";

// Render at 1200px logical width (2x = 2400 output) so the hero fills the frame.
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1200, height: 800 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: "networkidle" });

// Hide nav + everything past the hero/demo section so the OG image shows only the hero block.
await page.addStyleTag({
  content: `
    nav, header { display: none !important; }
    main > div { display: none !important; }
    footer { display: none !important; }
    main > section { padding-top: 32px !important; }
  `,
});

// Streaming sequence: root (~5s) → branch-left (~5s) → branch (~5s). Wait long
// enough for all three cards to fully render.
await page.waitForTimeout(18000);

const hero = page.locator("main > section").first();
const box = await hero.boundingBox();
if (!box) throw new Error("hero section not found");

const pad = 24;
await page.screenshot({
  path: OUT,
  clip: {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: Math.min(1200, box.width + pad * 2),
    height: box.height + pad * 2,
  },
});

await browser.close();
console.log(`wrote ${OUT}`);
