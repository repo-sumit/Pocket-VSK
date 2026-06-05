import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:5174";
const OUT = "verify-shots";
mkdirSync(OUT, { recursive: true });

const results = [];
const ok = (name, cond, extra = "") => {
  results.push({ name, pass: !!cond, extra });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
};

const shot = async (page, name) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }).catch(() => {});
};

async function loginTeacher(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /Teacher \/ Principal/ }).click();
  await page.getByPlaceholder("Your 10-digit ID").fill("2400000001");
  await page.getByPlaceholder("11-digit UDISE").fill("24010100101");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Continue & Sign In/ }).click();
  await page.waitForURL(`${BASE}/app`, { timeout: 8000 });
}

async function loginOfficer(page, id, pin) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /Officer/ }).click();
  await page.getByPlaceholder("Your ID").fill(id);
  await page.getByPlaceholder("4-digit PIN").fill(pin);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Continue & Sign In/ }).click();
  await page.waitForURL(`${BASE}/app`, { timeout: 8000 });
}

async function run(label, viewport) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  // ── Login validation (Teacher mode) ──
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /Teacher \/ Principal/ }).click();
  await page.getByPlaceholder("Your 10-digit ID").fill("123");
  await page.getByPlaceholder("Your 10-digit ID").blur();
  const idErr = await page.getByText(/must be exactly 10 digits/).isVisible().catch(() => false);
  ok(`${label} · login: 10-digit ID validation`, idErr);
  const continueDisabled = await page.getByRole("button", { name: "Continue", exact: true }).isDisabled();
  ok(`${label} · login: Continue disabled while invalid`, continueDisabled);
  await page.getByPlaceholder("Your 10-digit ID").fill("2400000001");
  await page.getByPlaceholder("11-digit UDISE").fill("123");
  await page.getByPlaceholder("11-digit UDISE").blur();
  const udiseErr = await page.getByText(/UDISE must be exactly 11 digits/).isVisible().catch(() => false);
  ok(`${label} · login: 11-digit UDISE validation`, udiseErr);
  await shot(page, `${label}-login-validation`);

  // ── Officer mode + PIN validation ──
  await page.getByRole("tab", { name: /Officer/ }).click();
  await page.getByPlaceholder("Your ID").fill("24");
  await page.getByPlaceholder("4-digit PIN").fill("12");
  await page.getByPlaceholder("4-digit PIN").blur();
  const pinErr = await page.getByText(/PIN must be exactly 4 digits/).isVisible().catch(() => false);
  ok(`${label} · login: 4-digit PIN validation`, pinErr);

  // ── Teacher journey ──
  await loginTeacher(page);
  ok(`${label} · teacher scorecard loads`, /\/app$/.test(page.url()));
  // PM SHRI hidden for teacher
  const pmHiddenTeacher = !(await page.getByText("PM SHRI", { exact: false }).first().isVisible().catch(() => false));
  ok(`${label} · PM SHRI hidden for teacher`, pmHiddenTeacher);
  await page.waitForTimeout(400);
  await shot(page, `${label}-teacher-scorecard`);

  // Compare
  await page.getByRole("link", { name: /Compare/ }).first().click();
  await page.waitForTimeout(500);
  await shot(page, `${label}-teacher-compare`);
  ok(`${label} · compare renders`, await page.locator("body").isVisible());

  // Sections
  await page.getByRole("link", { name: /Sections/ }).first().click();
  await page.waitForTimeout(500);
  await shot(page, `${label}-teacher-sections`);

  // ── Officer (State) journey: cross-level + PM SHRI present ──
  await loginOfficer(page, "24", "0000");
  ok(`${label} · state scorecard loads`, /\/app$/.test(page.url()));
  await page.waitForTimeout(400);
  await shot(page, `${label}-state-scorecard`);
  const pmVisibleState = await page.getByText("PM SHRI", { exact: false }).first().isVisible().catch(() => false);
  // PM SHRI only shows >= sm breakpoint; only assert on desktop
  if (viewport.width >= 640) ok(`${label} · PM SHRI visible for state`, pmVisibleState);

  await page.getByRole("link", { name: /Compare/ }).first().click();
  await page.waitForTimeout(600);
  await shot(page, `${label}-state-compare`);
  // a KPI cascade detail
  await page.goto(`${BASE}/app/kpi/att_pct`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, `${label}-state-kpi-cascade`);
  // no broken "GSOAC" typo anywhere on cascade page text
  await page.goto(`${BASE}/app/kpi/gsqac_score`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(400);
  const body = await page.locator("body").innerText();
  ok(`${label} · no "GSOAC" typo`, !/GSOAC/.test(body));
  await shot(page, `${label}-state-gsqac`);

  ok(`${label} · no console/page errors`, errors.length === 0, errors.slice(0, 3).join(" | "));
  await browser.close();
}

await run("desktop", { width: 1280, height: 800 });
await run("mobile", { width: 390, height: 844 });

const failed = results.filter((r) => !r.pass);
console.log(`\n==== ${results.length - failed.length}/${results.length} checks passed ====`);
if (failed.length) { console.log("FAILED:", failed.map((f) => f.name).join("; ")); process.exitCode = 1; }
