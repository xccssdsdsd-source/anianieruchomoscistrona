// Kontrola jakości strony publicznej: zrzuty ekranu i asercje.
// Uruchomienie:  node tools/qa.js [baseUrl] [outDir]
//
// Uwaga: elementy [data-reveal] są niewidoczne, dopóki nie odpali się
// IntersectionObserver — dlatego każdy zrzut poprzedzamy przewinięciem
// strony i wywołaniem window.__revealAll().
const path = require('path');
const fs = require('fs');

const PLAYWRIGHT = 'C:/Users/kajet/Downloads/Automatyzacja AI dla agencji nieruchomości/node_modules/playwright-core';
const { chromium } = require(PLAYWRIGHT);

const BASE = process.argv[2] || 'http://localhost:3210';
const OUT = process.argv[3] || path.join(__dirname, '..', '_backup', 'qa');

const BREAKPOINTY = [
  { w: 1920, h: 1080 },
  { w: 1440, h: 900 },
  { w: 1280, h: 800 },
  { w: 1024, h: 768 },
  { w: 768, h: 1024 },
  { w: 390, h: 844 },
  { w: 360, h: 740 }
];

const TRASY = [
  ['/', 'home'],
  ['/nieruchomosci', 'listings'],
  ['/nieruchomosci?kategoria=dzialka', 'listings-dzialka'],
  ['/nieruchomosci?kategoria=mieszkanie', 'listings-pusto'],
  ['/nieruchomosci/lokal-handlowy-166-m2-respan-rzeszow', 'oferta-lokal'],
  ['/nieruchomosci/dzialka-1-10-ha-z-domem-przy-drodze-asfaltowej', 'oferta-siedlisko'],
  ['/o-mnie', 'o-mnie'],
  ['/kontakt', 'kontakt'],
  ['/polityka-prywatnosci', 'prywatnosc'],
  ['/nie-ma-takiej-strony', '404']
];

async function przygotuj(page) {
  await page.evaluate(async () => {
    const krok = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += krok) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 110));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 350));
  });
  await page.evaluate(() => window.__revealAll && window.__revealAll());
  await page.waitForTimeout(550);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
  const problemy = [];

  for (const bp of BREAKPOINTY) {
    const ctx = await browser.newContext({ viewport: { width: bp.w, height: bp.h } });
    const page = await ctx.newPage();

    const konsola = [];
    page.on('console', (m) => { if (m.type() === 'error') konsola.push(m.text()); });
    page.on('pageerror', (e) => konsola.push('PAGEERROR: ' + e.message));

    for (const [url, nazwa] of TRASY) {
      konsola.length = 0;
      try {
        await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (e) {
        problemy.push(`[${bp.w}] ${nazwa}: nie wczytano — ${e.message.slice(0, 90)}`);
        continue;
      }
      await przygotuj(page);

      // Zrzut tylko na dwóch reprezentatywnych szerokościach — reszta to asercje.
      if (bp.w === 1440 || bp.w === 390) {
        await page.screenshot({ path: path.join(OUT, `${nazwa}-${bp.w}.png`), fullPage: true });
      }

      const wynik = await page.evaluate(() => {
        const przelew = document.documentElement.scrollWidth - window.innerWidth;
        const winowajcy = przelew > 1
          ? [...document.querySelectorAll('*')]
              .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
              .slice(0, 6)
              .map((el) => el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0])
          : [];

        const zaokraglone = [...document.querySelectorAll('*')]
          .filter((el) => {
            const s = getComputedStyle(el);
            return ['borderTopLeftRadius', 'borderTopRightRadius',
                    'borderBottomLeftRadius', 'borderBottomRightRadius']
              .some((k) => s[k] !== '0px' && s[k] !== '0%');
          })
          .slice(0, 6)
          .map((el) => el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0]);

        return { przelew, winowajcy, zaokraglone };
      });

      if (wynik.przelew > 1) {
        problemy.push(`[${bp.w}] ${nazwa}: przewijanie poziome +${wynik.przelew}px — ${wynik.winowajcy.join(', ')}`);
      }
      if (wynik.zaokraglone.length) {
        problemy.push(`[${bp.w}] ${nazwa}: zaokrąglone rogi — ${wynik.zaokraglone.join(', ')}`);
      }
      if (konsola.length) {
        problemy.push(`[${bp.w}] ${nazwa}: błędy konsoli — ${konsola.slice(0, 3).join(' | ')}`);
      }
    }
    await ctx.close();
  }

  // Kotwica pod przyklejonym nagłówkiem
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => { location.hash = '#aktualne-oferty'; });
    await page.waitForTimeout(900);
    const ok = await page.evaluate(() => {
      const cel = document.querySelector('#aktualne-oferty');
      const naglowek = document.querySelector('[data-header]');
      if (!cel || !naglowek) return false;
      return cel.getBoundingClientRect().top >= naglowek.getBoundingClientRect().height - 2;
    });
    if (!ok) problemy.push('Kotwica #aktualne-oferty chowa się pod nagłówkiem');
    await ctx.close();
  }

  // Diakrytyki i wczytanie kroju
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const font = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        fraunces: document.fonts.check('400 16px Fraunces'),
        manrope: document.fonts.check('400 16px Manrope'),
        tytul: (document.querySelector('.hero-title') || {}).textContent || ''
      };
    });
    if (!font.fraunces) problemy.push('Krój Fraunces nie został wczytany');
    if (!font.manrope) problemy.push('Krój Manrope nie został wczytany');
    if (!/[ąćęłńóśźż]/i.test(font.tytul)) problemy.push('Brak polskich znaków w nagłówku hero');
    await ctx.close();
  }

  // Ograniczony ruch
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const rm = await page.evaluate(() => {
      const ukryte = [...document.querySelectorAll('[data-reveal]')]
        .filter((el) => getComputedStyle(el).opacity !== '1').length;
      const px = document.querySelector('[data-parallax]');
      return {
        ukryte,
        parallaxInline: px ? px.style.transform : '',
        shimmer: (() => {
          const l = document.querySelector('.sk-line');
          return l ? getComputedStyle(l, '::after').display : 'brak';
        })()
      };
    });
    if (rm.ukryte) problemy.push(`Reduced motion: ${rm.ukryte} elementów [data-reveal] wciąż niewidocznych`);
    if (rm.parallaxInline) problemy.push('Reduced motion: parallaksa mimo wszystko zapisała transform');
    if (rm.shimmer !== 'none' && rm.shimmer !== 'brak') problemy.push('Reduced motion: shimmer skeletonu nadal aktywny');
    await ctx.close();
  }

  // Filtrowanie i sortowanie
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const wszystkie = await page.evaluate(() =>
      document.querySelectorAll('[data-offer]:not([hidden])').length);

    await page.click('[data-filter="kategoria"][data-value="dzialka"]');
    await page.waitForTimeout(450);
    const dzialki = await page.evaluate(() =>
      [...document.querySelectorAll('[data-offer]:not([hidden])')]
        .every((el) => el.dataset.kategoria === 'dzialka'));
    if (!dzialki) problemy.push('Filtr „Działki” pokazuje oferty z innych kategorii');

    await page.click('[data-filter="kategoria"][data-value="mieszkanie"]');
    await page.waitForTimeout(450);
    const pustka = await page.evaluate(() => {
      const es = document.querySelector('[data-empty-state]');
      return es && !es.hidden;
    });
    if (!pustka) problemy.push('Brak zaprojektowanego stanu pustki po odfiltrowaniu wszystkiego');

    await page.click('[data-filter="kategoria"][data-value=""]');
    await page.waitForTimeout(450);
    await page.selectOption('[data-sort]', 'powierzchnia-malejaco');
    await page.waitForTimeout(500);
    const posortowane = await page.evaluate(() => {
      const v = [...document.querySelectorAll('[data-offer]:not([hidden])')]
        .map((el) => parseFloat(el.dataset.powierzchnia) || 0);
      return v.every((x, i) => i === 0 || v[i - 1] >= x);
    });
    if (!posortowane) problemy.push('Sortowanie po powierzchni malejąco nie działa');
    if (wszystkie === 0) problemy.push('Na stronie głównej nie wyrenderowano żadnej oferty');
    await ctx.close();
  }

  // Asystent doboru
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.fill('[data-advisor] textarea', 'Szukam działki pod dom pod Rzeszowem, blisko lasu');
    await page.click('[data-advisor-submit]');
    await page.waitForTimeout(3500);
    const out = await page.evaluate(() => {
      const o = document.querySelector('[data-advisor-out]');
      return { widoczny: o && !o.hidden, tekst: o ? o.textContent.trim().slice(0, 120) : '' };
    });
    if (!out.widoczny || !out.tekst) problemy.push('Asystent doboru nie zwrócił żadnej odpowiedzi');
    await ctx.close();
  }

  await browser.close();

  console.log('\n═══ WYNIK QA ═══');
  if (!problemy.length) {
    console.log('Brak zastrzeżeń. Zrzuty: ' + OUT);
  } else {
    problemy.forEach((p) => console.log(' ✗ ' + p));
    console.log(`\n${problemy.length} problem(ów). Zrzuty: ${OUT}`);
  }
  process.exit(problemy.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
