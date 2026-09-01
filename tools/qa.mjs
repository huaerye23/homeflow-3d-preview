import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = path.resolve("D:/XM/Nx/home");
const playwrightEntry = "C:/Users/26432/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const { chromium } = await import(pathToFileURL(playwrightEntry).href);
const qaDir = path.join(projectRoot, "qa");
await fs.mkdir(qaDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: [
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--use-gl=angle",
    "--use-angle=swiftshader",
  ],
});

const errors = [];
const report = { generatedAt: new Date().toISOString(), url: "http://127.0.0.1:4173/", checks: [] };

function watch(page, label) {
  page.on("pageerror", (error) => errors.push({ label, type: "pageerror", message: error.message }));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push({ label, type: "console", message: message.text() });
  });
}

async function inspect(page, label) {
  const state = await page.evaluate((labelValue) => {
    const canvas = document.querySelector("canvas");
    const rect = canvas?.getBoundingClientRect();
    const sidebar = document.querySelector(".sidebar")?.getBoundingClientRect();
    const gl = canvas?.getContext("webgl2") || canvas?.getContext("webgl");
    return {
      label: labelValue,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      documentSize: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
      horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
      canvas: rect ? { width: Math.round(rect.width), height: Math.round(rect.height), backingWidth: canvas.width, backingHeight: canvas.height } : null,
      webgl: Boolean(gl),
      cameraDistance: Number(document.querySelector(".scene-host")?.getAttribute("data-camera-distance")),
      usableArea: document.querySelector(".app-shell")?.dataset.usableArea?.trim(),
      interiorArea: document.querySelector(".app-shell")?.dataset.interiorArea?.trim(),
      areaBasis: document.querySelector(".app-shell")?.dataset.areaBasis?.trim(),
      sidebar: sidebar ? { left: Math.round(sidebar.left), right: Math.round(sidebar.right), width: Math.round(sidebar.width) } : null,
      roomButtons: document.querySelectorAll(".room-row").length,
      toggles: Array.from(document.querySelectorAll("[role=switch]")).map((node) => ({
        label: node.getAttribute("aria-label"),
        checked: node.getAttribute("aria-checked"),
      })),
    };
  }, label);
  report.checks.push(state);
  return state;
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
watch(desktop, "desktop");
await desktop.goto(report.url, { waitUntil: "networkidle" });
await desktop.locator("canvas").waitFor({ state: "visible" });
await desktop.waitForTimeout(2600);
const desktop3d = await inspect(desktop, "desktop-3d");
if (desktop3d.usableArea !== "120.7 m²" || desktop3d.interiorArea !== "112.7 m²" || desktop3d.roomButtons !== 14) {
  errors.push({ label: "area", type: "calculation", message: `unexpected areas/rooms ${desktop3d.usableArea} / ${desktop3d.interiorArea} / ${desktop3d.roomButtons}` });
}
if (!desktop3d.areaBasis?.includes("8.0㎡ 阳台") || !desktop3d.areaBasis?.includes("不含电梯/公区")) {
  errors.push({ label: "area-basis", type: "calculation", message: `unexpected basis ${desktop3d.areaBasis}` });
}
await desktop.screenshot({ path: path.join(qaDir, "desktop-3d.png") });

await desktop.locator("canvas").hover();
await desktop.mouse.wheel(0, -520);
await desktop.waitForTimeout(700);
const wheelDistance = Number(await desktop.locator(".scene-host").getAttribute("data-camera-distance"));
await desktop.waitForTimeout(700);
const stableWheelDistance = Number(await desktop.locator(".scene-host").getAttribute("data-camera-distance"));
report.checks.push({ label: "desktop-wheel-zoom", before: desktop3d.cameraDistance, after: wheelDistance, stableAfter: stableWheelDistance });
if (!(wheelDistance < desktop3d.cameraDistance - 0.1) || !(stableWheelDistance < desktop3d.cameraDistance - 0.1)) {
  errors.push({ label: "desktop-wheel-zoom", type: "interaction", message: "wheel zoom did not persist" });
}

await desktop.getByRole("button", { name: "重置视图" }).click();
await desktop.waitForTimeout(1700);
const resetDistance = Number(await desktop.locator(".scene-host").getAttribute("data-camera-distance"));
await desktop.getByRole("button", { name: "放大视图" }).click();
await desktop.waitForTimeout(400);
const buttonZoomDistance = Number(await desktop.locator(".scene-host").getAttribute("data-camera-distance"));
report.checks.push({ label: "desktop-button-zoom", before: resetDistance, after: buttonZoomDistance });
if (!(buttonZoomDistance < resetDistance - 0.1)) {
  errors.push({ label: "desktop-button-zoom", type: "interaction", message: "zoom button did not change camera distance" });
}
await desktop.getByRole("button", { name: "重置视图" }).click();
await desktop.waitForTimeout(1300);

await desktop.getByRole("button", { name: "平面俯视" }).click();
await desktop.waitForTimeout(500);
const desktopPlan = await inspect(desktop, "desktop-plan");
await desktop.locator("canvas").hover();
await desktop.mouse.wheel(0, -420);
await desktop.waitForTimeout(450);
const planZoomDistance = Number(await desktop.locator(".scene-host").getAttribute("data-camera-distance"));
report.checks.push({ label: "plan-wheel-zoom", before: desktopPlan.cameraDistance, after: planZoomDistance });
if (!(planZoomDistance < desktopPlan.cameraDistance - 0.1)) {
  errors.push({ label: "plan-wheel-zoom", type: "interaction", message: "plan wheel zoom did not change camera distance" });
}
await desktop.getByRole("button", { name: "重置视图" }).click();
await desktop.waitForTimeout(350);
await desktop.screenshot({ path: path.join(qaDir, "desktop-plan.png") });

await desktop.getByRole("button", { name: "3D 漫游" }).click();
await desktop.getByRole("button", { name: /客厅.*27\.2/ }).click();
await desktop.waitForTimeout(1700);
await inspect(desktop, "desktop-room-focus");
await desktop.screenshot({ path: path.join(qaDir, "desktop-room-focus.png") });

for (const size of [
  { width: 375, height: 812, name: "mobile-375" },
  { width: 320, height: 740, name: "mobile-320" },
]) {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
  watch(page, size.name);
  await page.goto(report.url, { waitUntil: "networkidle" });
  await page.locator("canvas").waitFor({ state: "visible" });
  await page.waitForTimeout(2200);
  const state = await inspect(page, size.name);
  if (state.horizontalOverflow > 1) {
    errors.push({ label: size.name, type: "layout", message: `horizontal overflow ${state.horizontalOverflow}px` });
  }
  await page.screenshot({ path: path.join(qaDir, `${size.name}.png`) });
  if (size.width === 375) {
    await page.getByRole("button", { name: "打开导航" }).click();
    await page.waitForTimeout(500);
    const menuState = await page.locator(".sidebar").evaluate((node) => ({
      visible: node.classList.contains("is-open"),
      left: Math.round(node.getBoundingClientRect().left),
      right: Math.round(node.getBoundingClientRect().right),
    }));
    report.checks.push({ label: "mobile-menu", ...menuState });
    await page.screenshot({ path: path.join(qaDir, "mobile-375-menu.png") });
  }
  await page.close();
}

report.errors = errors;
report.passed = errors.length === 0 && report.checks.every((check) => check.webgl !== false);
await fs.writeFile(path.join(qaDir, "runtime-report.json"), JSON.stringify(report, null, 2), "utf8");
await browser.close();

console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
