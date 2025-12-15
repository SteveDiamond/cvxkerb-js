const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Opening rocket simulation...');
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000);

  console.log('Clicking LAUNCH button...');
  await page.click('text=LAUNCH');

  // Take screenshots during flight
  for (let i = 1; i <= 8; i++) {
    await page.waitForTimeout(2000);
    console.log(`Screenshot ${i} at T+${i*2}s...`);
    await page.screenshot({ path: `/tmp/rocket-${i}.png` });
  }

  console.log('Done!');
  await browser.close();
})();
