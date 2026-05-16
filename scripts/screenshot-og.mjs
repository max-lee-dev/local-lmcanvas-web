import { chromium } from "playwright";

const URL = process.env.URL ?? "http://localhost:5180/";
const OUT = process.env.OUT ?? "public/og-image.png";

// Render the hero block at OG aspect (1200x630). 2x DSF → 2400x1260 output.
const VW = 1200;
const VH = 630;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: "networkidle" });

// Strip everything except the hero h1, then enlarge + center it so the title
// fills the OG frame.
await page.addStyleTag({
  content: `
    nav, header, footer { display: none !important; }
    main > div { display: none !important; }
    /* hide the CanvasDemo column inside the hero grid */
    main > section > div > div:nth-child(2) { display: none !important; }
    /* hide everything in the Hero section except the h1 */
    main > section > div > div:first-child section > :not(h1) {
      display: none !important;
    }
    /* center + scale the title to fill the OG canvas */
    main > section { padding: 0 !important; max-width: none !important; }
    main > section > div {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 630px !important;
      padding: 0 64px !important;
      grid-template-columns: none !important;
    }
    main > section > div > div:first-child {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    main > section > div > div:first-child section {
      padding-top: 0 !important;
      width: 100%;
      align-items: center;
    }
    main > section h1 {
      width: 100% !important;
      max-width: none !important;
      text-align: center !important;
      font-size: 8.5rem !important;
      line-height: 0.95 !important;
      margin: 0 !important;
    }
  `,
});

// No streaming to wait on now — just give fonts a beat to settle.
await page.waitForTimeout(800);

await page.screenshot({ path: OUT, fullPage: false });

await browser.close();
console.log(`wrote ${OUT}`);
