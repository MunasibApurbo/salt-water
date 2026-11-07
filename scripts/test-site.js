#!/usr/bin/env node
/**
 * Automated Verification & Health Check Test Suite
 * Sundarbans Photography Archive
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium, devices } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('\n--- 1. File Integrity & Asset Existence Checks ---');

  const requiredFiles = [
    'index.html',
    'css/styles.css',
    'js/main.js',
    'vercel.json',
    'README.md',
    '.gitignore',
    '.vercelignore',
    'robots.txt',
    'package.json',
    'assets/images/logo.png',
    'assets/images/film_grain_tile.png',
    'assets/images/paper_grain_texture.png',
    'assets/images/web/hero_poster.jpg',
    'assets/images/web/footer_halftone.jpg',
    'assets/videos/showreel_web.mp4',
    'assets/videos/showreel_mobile.mp4',
    'assets/data/photos.json',
    'assets/data/photos.js'
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(ROOT_DIR, relPath);
    assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
    const stat = fs.statSync(fullPath);
    assert(stat.size > 0, `File is non-empty (${stat.size} bytes): ${relPath}`);
  }

  console.log('\n--- 2. Dataset & Catalog Verification ---');
  const photosJsonRaw = fs.readFileSync(path.join(ROOT_DIR, 'assets/data/photos.json'), 'utf8');
  const catalog = JSON.parse(photosJsonRaw);
  assert(catalog.photos && catalog.photos.length === 31, `Catalog contains 31 photos (found ${catalog.photos?.length})`);

  for (const photo of catalog.photos) {
    const webFile = path.join(ROOT_DIR, photo.web_src);
    const thumbFile = path.join(ROOT_DIR, photo.thumb_src);
    assert(fs.existsSync(webFile), `Web image exists: ${photo.web_src}`);
    assert(fs.existsSync(thumbFile), `Thumb image exists: ${photo.thumb_src}`);
  }

  console.log('\n--- 3. Local Web Server & Browser Verification ---');
  const server = http.createServer((req, res) => {
    let filePath = path.join(ROOT_DIR, decodeURIComponent(req.url.split('?')[0]));
    if (filePath.endsWith('/') || filePath === ROOT_DIR) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.txt': 'text/plain'
    };

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found: ' + req.url);
        return;
      }
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  const PORT = 4579;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running at http://localhost:${PORT}`);

  const browser = await chromium.launch();

  try {
    // --- Desktop Viewport Test ---
    console.log('\n--- Desktop Viewport (1440x900) ---');
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const desktopErrors = [];
    const desktopFailedReqs = [];

    desktopPage.on('console', (msg) => {
      if (msg.type() === 'error') desktopErrors.push(msg.text());
    });
    desktopPage.on('pageerror', (err) => desktopErrors.push(err.message));
    desktopPage.on('requestfailed', (req) => {
      desktopFailedReqs.push(`${req.url()} (${req.failure()?.errorText})`);
    });

    await desktopPage.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(1000);

    const title = await desktopPage.title();
    assert(title.includes('Munasib Apurbo'), `Page title is valid: "${title}"`);

    const desktopCards = await desktopPage.locator('.photo-card').count();
    assert(desktopCards === 31, `Rendered all 31 gallery photo cards on desktop (found ${desktopCards})`);

    const desktopSvgDisplay = await desktopPage.$eval('#hydro-chart-svg', (el) => window.getComputedStyle(el).display);
    assert(desktopSvgDisplay !== 'none', 'Desktop hydrographic survey chart is visible');

    // Test Lightbox Interaction
    await desktopPage.locator('.photo-card').first().click();
    await desktopPage.waitForTimeout(300);
    const lbOpen = await desktopPage.$eval('#lightbox-modal', (el) => el.open);
    assert(lbOpen === true, 'Lightbox modal opens successfully on photo click');

    const lbSrc = await desktopPage.$eval('#lb-img', (el) => el.src);
    assert(lbSrc.includes('/assets/images/web/'), `Lightbox loaded high-res image: ${lbSrc}`);

    await desktopPage.click('#lb-close');
    await desktopPage.waitForTimeout(200);

    assert(desktopErrors.length === 0, `Zero console errors on desktop (found ${desktopErrors.length})`);
    assert(desktopFailedReqs.length === 0, `Zero failed requests on desktop (found ${desktopFailedReqs.length})`);
    await desktopPage.close();

    // --- Mobile Viewport Test ---
    console.log('\n--- Mobile Viewport (iPhone 14) ---');
    const mobileContext = await browser.newContext({ ...devices['iPhone 14'] });
    const mobilePage = await mobileContext.newPage();
    const mobileErrors = [];

    mobilePage.on('console', (msg) => {
      if (msg.type() === 'error') mobileErrors.push(msg.text());
    });
    mobilePage.on('pageerror', (err) => mobileErrors.push(err.message));

    await mobilePage.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(1000);

    const mobileSvgVisible = await mobilePage.$eval('#hydro-chart-svg-mobile', (el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && rect.width > 0;
    });
    assert(mobileSvgVisible === true, 'Mobile-optimized single-viewport route map is visible');

    const mobileCards = await mobilePage.locator('.photo-card').count();
    assert(mobileCards === 31, `Rendered all 31 gallery photo cards on mobile (found ${mobileCards})`);
    assert(mobileErrors.length === 0, `Zero console errors on mobile (found ${mobileErrors.length})`);

    await mobileContext.close();

    // --- Dynamic Multi-Device & Ratio Matrix Checks ---
    console.log('\n--- Dynamic Ratio & Device Matrix Checks ---');
    const ratioMatrix = [
      { name: 'iPhone SE (375x667)', w: 375, h: 667 },
      { name: 'Phone Landscape (844x390)', w: 844, h: 390 },
      { name: 'iPad Mini Portrait (768x1024)', w: 768, h: 1024 },
      { name: 'iPad Air 11 (834x1194)', w: 834, h: 1194 },
      { name: 'iPad Pro 12.9 (1024x1366)', w: 1024, h: 1366 },
      { name: 'MacBook Air 13 (1280x800)', w: 1280, h: 800 },
      { name: 'MacBook Pro 16 (1728x1117)', w: 1728, h: 1117 },
      { name: 'Ultrawide 21:9 (2560x1080)', w: 2560, h: 1080 }
    ];

    for (const dev of ratioMatrix) {
      const p = await browser.newPage({ viewport: { width: dev.w, height: dev.h } });
      await p.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(300);

      const docWidth = await p.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await p.evaluate(() => document.documentElement.clientWidth);
      assert(docWidth <= clientWidth, `No horizontal overflow on ${dev.name} (${docWidth} <= ${clientWidth})`);

      const count = await p.locator('.photo-card').count();
      assert(count === 31, `Rendered all 31 cards on ${dev.name}`);
      await p.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n✨ ALL TESTS PASSED! Project is healthy and ready for deployment.\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
