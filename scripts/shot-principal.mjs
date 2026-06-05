import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:5174";
const browser = await chromium.launch();
for (const [label, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /Teacher \/ Principal/ }).click();
  await page.getByPlaceholder("Your 10-digit ID").fill("2400000002");
  await page.getByPlaceholder("11-digit UDISE").fill("24010100101");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Continue & Sign In/ }).click();
  await page.waitForURL(`${BASE}/app`, { timeout: 8000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `verify-shots/${label}-principal-scorecard.png`, fullPage: true });
  console.log(`shot ${label}-principal-scorecard`);
}
await browser.close();
