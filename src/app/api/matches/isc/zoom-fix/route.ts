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
    // Lancer le navigateur avec des paramètres spécifiques pour corriger le zoom
    browser = await chromium.launch({
      headless: false,
      args: [
        '--start-maximized',
        '--force-device-scale-factor=0.7',
        '--window-size=1600,1200'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1600, height: 1200 },
      deviceScaleFactor: 0.7,
      isMobile: false,
    });

    const page = await context.newPage();
    
    // Naviguer vers ISC
    await page.goto('https://www.isc.ro/', { waitUntil: 'networkidle' });
    
    // Appliquer un zoom arrière supplémentaire
    await page.keyboard.down('Control');
    await page.keyboard.press('Minus');
    await page.keyboard.press('Minus');
    await page.keyboard.up('Control');
    
    // Attendre que l'utilisateur puisse voir le résultat
    await page.waitForTimeout(15000);
    
    // Prendre une capture d'écran
    const screenshot = await page.screenshot({ fullPage: true });

    return new NextResponse(screenshot, {
      status: 200,
      headers: {
        'Content-Type': 'image/png'
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
