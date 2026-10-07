const puppeteer = require("puppeteer");
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1512, height: 861 });
  await page.goto("http://localhost:5175/overview", { waitUntil: "networkidle0" });
  await page.screenshot({ path: "/Users/uxazrul/.gemini/antigravity-ide/brain/89562efe-4947-4701-a9d7-e5b487e314c2/overview_fixed.png" });
  await browser.close();
})();
