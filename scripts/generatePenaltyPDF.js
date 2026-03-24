/**
 * Generates Paraallax_Penalty_Guide.pdf from the running dev server.
 * Run: node scripts/generatePenaltyPDF.js
 *
 * Requires puppeteer:
 *   npm install --save-dev puppeteer   (if not already installed)
 */

const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('🚀 Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.setViewport({ width: 794, height: 1123 }); // A4 at 96dpi

    console.log('📄 Loading penalty guide page...');
    await page.goto('http://localhost:3000/penalty-guide.html', {
        waitUntil: 'networkidle0',
        timeout: 30000,
    });

    // Wait for fonts to render
    await new Promise(r => setTimeout(r, 2500));

    const outputPath = path.resolve(__dirname, '../public/Paraallax_Penalty_Guide.pdf');

    console.log('🖨️  Generating PDF...');
    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,   // render background colours & gradients
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        displayHeaderFooter: false,
    });

    await browser.close();

    console.log(`✅ PDF saved to: ${outputPath}`);
})();
