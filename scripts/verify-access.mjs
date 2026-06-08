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
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }).catch(() => {});

const SESSION_KEY = "unified-portal-session";
const getScope = (page) =>
  page.evaluate((k) => { const r = localStorage.getItem(k); return r ? JSON.parse(r).state.scopeId : null; }, SESSION_KEY);
const setScope = (page, sid) =>
  page.evaluate(({ k, sid }) => {
    const r = localStorage.getItem(k); if (!r) return;
    const d = JSON.parse(r); d.state.scopeId = sid; localStorage.setItem(k, JSON.stringify(d));
  }, { k: SESSION_KEY, sid });

async function loginOfficer(page, id, pin) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /Officer/ }).click();
  await page.getByPlaceholder("Your ID").fill(id);
  await page.getByPlaceholder("4-digit PIN").fill(pin);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Continue & Sign In/ }).click();
  await page.waitForURL(`${BASE}/app`, { timeout: 8000 });
  await page.waitForTimeout(400);
}
async function loginTP(page, id, udise) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /Teacher \/ Principal/ }).click();
  await page.getByPlaceholder("Your 10-digit ID").fill(id);
  await page.getByPlaceholder("11-digit UDISE").fill(udise);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Continue & Sign In/ }).click();
  await page.waitForURL(`${BASE}/app`, { timeout: 8000 });
  await page.waitForTimeout(400);
}
async function tamperReload(page, sid) {
  await setScope(page, sid);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  return getScope(page);
}

const browser = await chromium.launch();

// ──────────────────────────────────────────────────────────────────────
// BLOCK (BRC) — the reported bug: a Block user must NOT see State/District
// ──────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));

  await loginOfficer(page, "240101", "2345"); // BRC Ila Patel → home block-240101
  ok("block: scoped to home block at login", (await getScope(page)) === "block-240101", await getScope(page));
  await shot(page, "ac-block-scorecard");

  // upward escape attempts via tampered localStorage (the screenshot-1 bug path)
  ok("block: tamper→State clamps to home", (await tamperReload(page, "st-gj")) === "block-240101");
  ok("block: tamper→District clamps to home", (await tamperReload(page, "dist-2401")) === "block-240101");
  // a descendant (a cluster under this block) IS allowed — drill-down stays
  ok("block: tamper→own cluster allowed", (await tamperReload(page, "cluster-2401010005")) === "cluster-2401010005");
  await tamperReload(page, "block-240101"); // reset to home

  // Compare picker: peers + subtree only, never ancestors
  await page.goto(`${BASE}/app/compare`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Add comparison/ }).click();
  await page.waitForTimeout(250);
  const panel = await page.locator(".shadow-raised").last().innerText().catch(() => "");
  ok("block compare: offers Peers group", /Peers/i.test(panel), panel.replace(/\n/g, " ").slice(0, 80));
  ok("block compare: no District/State options", !/\bDistrict\b/i.test(panel) && !/\bState\b/i.test(panel));
  await page.keyboard.press("Escape");
  await shot(page, "ac-block-compare");

  // Leaderboard peers tab: rows are read-only (cannot open a sibling block)
  await page.goto(`${BASE}/app/leaderboard`, { waitUntil: "networkidle" });
  const peersTab = page.getByRole("tab", { name: /Peers/ });
  if (await peersTab.count()) { await peersTab.click(); await page.waitForTimeout(250); }
  const beforeUrl = page.url();
  const beforeScope = await getScope(page);
  const row = page.locator("ol li").first();
  if (await row.count()) await row.click({ trial: false }).catch(() => {});
  await page.waitForTimeout(300);
  ok("block leaderboard: peer row does not navigate", page.url() === beforeUrl && (await getScope(page)) === beforeScope);
  await shot(page, "ac-block-leaderboard");

  ok("block: no page errors", errs.length === 0, errs.slice(0, 2).join(" | "));
  await ctx.close();
}

// ──────────────────────────────────────────────────────────────────────
// PRINCIPAL — must not see other schools / ancestors; State avg read-only OK
// ──────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await loginTP(page, "2400000002", "24010100101"); // principal → sch-24010100101
  ok("principal: scoped to own school at login", (await getScope(page)) === "sch-24010100101", await getScope(page));
  ok("principal: tamper→State clamps to school", (await tamperReload(page, "st-gj")) === "sch-24010100101");
  ok("principal: tamper→parent cluster clamps to school", (await tamperReload(page, "cluster-2401010005")) === "sch-24010100101");
  await tamperReload(page, "sch-24010100101");
  const body = await page.locator("body").innerText();
  // 4A: principal sees the unified home — School Quality output + input cards (peer
  // comparison is now vs the parent/cluster average per §4, not a fixed State baseline)
  ok("principal: 4A home renders (School Quality output shown)", /School Quality/i.test(body));
  await shot(page, "ac-principal-scorecard");
  await ctx.close();
}

// ──────────────────────────────────────────────────────────────────────
// DROPDOWNS — custom design-system Select (combobox + search + a11y)
// ──────────────────────────────────────────────────────────────────────
for (const [label, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await loginOfficer(page, "24", "0000"); // State → full subtree, long school list
  await page.goto(`${BASE}/app/sections`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const schoolSel = page.getByRole("button", { name: "School", exact: true }).first();
  ok(`${label} dropdown: custom Select present (not native)`, (await schoolSel.getAttribute("aria-haspopup")) === "listbox");
  await schoolSel.click();
  await page.waitForTimeout(200);
  const combo = page.getByRole("combobox");
  ok(`${label} dropdown: opens a searchable combobox`, await combo.isVisible().catch(() => false));
  const before = await page.getByRole("option").count();
  await combo.fill("a");
  await page.waitForTimeout(200);
  const after = await page.getByRole("option").count();
  ok(`${label} dropdown: type-to-search filters`, before > 0 && after > 0 && after <= before, `${before}→${after}`);
  await shot(page, `ac-dropdown-open-${label}`);
  // keyboard: ArrowDown + Enter selects
  await combo.fill("");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  ok(`${label} dropdown: keyboard select closes list`, (await page.getByRole("option").count()) === 0);
  await shot(page, `ac-sections-${label}`);
  await ctx.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n==== ${results.length - failed.length}/${results.length} access/dropdown checks passed ====`);
if (failed.length) { console.log("FAILED:", failed.map((f) => f.name).join("; ")); process.exitCode = 1; }
await browser.close();
