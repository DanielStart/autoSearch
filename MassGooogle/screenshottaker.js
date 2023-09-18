const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Funktion zum Erstellen von Screenshots
async function takeScreenshot(id, url, folderPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setRequestInterception(true);
  page.on('request', (req) => {
      if(req.resourceType() === 'script')
          req.abort();
      else
          req.continue();
  });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => console.log('timeout', e));

  // Vollbild-Screenshot
  const bodyHandle = await page.$('body');
  const { width, height } = await bodyHandle.boundingBox();
  await page.setViewport({ width: Math.ceil(width), height: Math.ceil(height) });
  await bodyHandle.dispose();

  const screenshotPath = path.join(folderPath, `${id}_${formatDate(new Date())}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await browser.close();
}

// Funktion zur Datumsformatierung
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Hauptlogik
async function main() {
  // Ordner für Screenshots erstellen
  const folderName = formatDate(new Date());
  const folderPath = path.join(__dirname, folderName);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  // Datei einlesen
  const data = fs.readFileSync('podcastPartners.txt', 'utf8');
  const lines = data.split('\n');

  // Durch die Zeilen iterieren und Screenshots machen
  for (const line of lines) {
    const [id, url] = line.split('\t');
    if (id && url) {
      await takeScreenshot(id, url, folderPath).catch(console.error);
    }
  }
}

main().catch(console.error);