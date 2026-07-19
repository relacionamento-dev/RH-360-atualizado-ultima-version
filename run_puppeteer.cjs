const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString(), err.stack));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  console.log("Clicking login");
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  
  // Click everything that looks like a menu item or button
  const buttons = await page.$$('button, [role="button"], a');
  console.log(`Found ${buttons.length} buttons/links`);
  
  for (let i = 0; i < buttons.length; i++) {
    try {
      await buttons[i].click();
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {}
  }
  
  await browser.close();
})();
