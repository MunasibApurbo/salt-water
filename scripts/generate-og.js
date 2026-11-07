const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  const imgPath = path.resolve(__dirname, '../assets/images/web/IMG_4442.jpg');
  const imgBase64 = fs.readFileSync(imgPath).toString('base64');

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: 1200px;
        height: 630px;
        position: relative;
        overflow: hidden;
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        background: #111;
      }
      .bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 38%;
        transform: scale(1.02);
      }
      .scrim {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to top,
          rgba(10, 16, 14, 0.94) 0%,
          rgba(10, 16, 14, 0.78) 32%,
          rgba(10, 16, 14, 0.42) 58%,
          rgba(10, 16, 14, 0.15) 80%,
          rgba(10, 16, 14, 0.05) 100%
        );
      }
      .content {
        position: absolute;
        bottom: 72px;
        left: 80px;
        right: 120px;
        z-index: 2;
        color: #ffffff;
      }
      h1 {
        font-size: 58px;
        font-weight: 600;
        letter-spacing: -0.025em;
        line-height: 1.12;
        color: #ffffff;
        margin-bottom: 16px;
        text-shadow: 0 4px 20px rgba(0,0,0,0.45);
      }
      p {
        font-size: 24px;
        font-weight: 400;
        line-height: 1.45;
        color: rgba(245, 248, 246, 0.88);
        letter-spacing: -0.01em;
        max-width: 880px;
        text-shadow: 0 2px 10px rgba(0,0,0,0.5);
      }
    </style>
  </head>
  <body>
    <img class="bg" src="data:image/jpeg;base64,${imgBase64}" />
    <div class="scrim"></div>
    <div class="content">
      <h1>Salt Water</h1>
      <p>A drift down southern rivers, into the silence of the mangroves, and out to the open sea.</p>
    </div>
  </body>
  </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const outPath = path.resolve(__dirname, '../assets/images/web/og_preview.jpg');
  await page.screenshot({ path: outPath, type: 'jpeg', quality: 92 });
  console.log('✅ og_preview.jpg generated successfully at:', outPath);

  await browser.close();
})();
