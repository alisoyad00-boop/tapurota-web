/* Screenshot helper that can perform actions before capturing.
   Usage: node screenshot-action.mjs <url> <label> <action>
   Action: open-menu | tap-filter:<value> | scroll:<px>
*/
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2];
const label = process.argv[3] || 'action';
const action = process.argv[4] || '';

const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
let n = 1;
while (fs.existsSync(path.join(dir, `screenshot-${n}-${label}.png`))) n++;
const out = path.join(dir, `screenshot-${n}-${label}.png`);

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 600));

if (action === 'open-menu') {
  await page.click('.nav-mobile-toggle');
  await new Promise(r => setTimeout(r, 600));
} else if (action.startsWith('tap-filter:')) {
  const v = action.split(':')[1];
  await page.click(`[data-filter-tab="${v}"]`);
  await new Promise(r => setTimeout(r, 400));
} else if (action.startsWith('scroll:')) {
  const px = parseInt(action.split(':')[1], 10);
  await page.evaluate(y => window.scrollTo(0, y), px);
  await new Promise(r => setTimeout(r, 400));
}

await page.screenshot({ path: out, fullPage: action === '' });
await browser.close();
console.log(out);
