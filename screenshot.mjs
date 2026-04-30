import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2];
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const viewport = process.argv[4] || 'desktop';

if (!url) {
  console.error('usage: node screenshot.mjs <url> [label] [desktop|mobile]');
  process.exit(1);
}

const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let n = 1;
while (fs.existsSync(path.join(dir, `screenshot-${n}${label}.png`))) n++;
const out = path.join(dir, `screenshot-${n}${label}.png`);

const sizes = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport(sizes[viewport] || sizes.desktop);
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
