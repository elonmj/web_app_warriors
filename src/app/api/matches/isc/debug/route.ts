import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Debug endpoint not available in production' },
      { status: 403 }
    );
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: false,
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();
    
    // Navigate to a test page that shows browser info
    await page.goto('https://www.whatismybrowser.com/');
    
    // Wait for 10 seconds to let user see the browser
    await page.waitForTimeout(10000);
    
    // Take screenshot
    const screenshot = await page.screenshot({ fullPage: true });
    
    // Get some browser info
    const userAgent = await page.evaluate(() => navigator.userAgent);
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    }));

    return new NextResponse(screenshot, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'X-User-Agent': userAgent,
        'X-Viewport': JSON.stringify(viewport)
      }
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}
