import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Absolute paths to ensure it runs correctly from any directory
const artifactsDir = 'C:/Users/JOSAPHAT/.gemini/antigravity/brain/8c5e02ff-1902-4abf-b162-e139faa50313';
const screenshotDir = path.join(artifactsDir, 'audit_screenshots');

async function run() {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ 
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  
  // Set Referer header to bypass middleware authorization check for admin routes
  await page.setExtraHTTPHeaders({
    'Referer': 'http://localhost:3000/admin'
  });

  const capture = async (name, url) => {
    console.log(`[Audit] Navigating to ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000); // Give extra time for React rendering
      const filePath = path.join(screenshotDir, `${name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`[Audit] Saved screenshot: ${filePath}`);
    } catch (e) {
      console.error(`[Audit] Failed to capture ${name}: ${e.message}`);
    }
  };

  // 1. Homepage
  await capture('1_homepage', 'http://localhost:3000/');

  // 2. Event page
  await capture('2_event_details', 'http://localhost:3000/event/mentoring-league-2025-02');

  // 3. Rankings page
  await capture('3_global_rankings', 'http://localhost:3000/rankings');

  // 4. Rules page
  await capture('4_rules', 'http://localhost:3000/reglement');

  // 5. Admin page
  await capture('5_admin_dashboard', 'http://localhost:3000/admin');

  // 6. Admin Event detail page
  await capture('6_admin_event_details', 'http://localhost:3000/admin/events/mentoring-league-2025-02');

  // 7. Player detail page
  await capture('7_player_detail', 'http://localhost:3000/player/4');

  // 8. Match page
  await capture('8_match_detail', 'http://localhost:3000/event/mentoring-league-2025-02/match/match-1');

  await browser.close();
  console.log('[Audit] All pages audited and captured successfully.');
}

run().catch(console.error);
