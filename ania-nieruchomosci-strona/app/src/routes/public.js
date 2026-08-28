// Trasy publiczne: strona główna, oferty, o mnie, kontakt, SEO.
const express = require('express');
const store = require('../lib/store');
const h = require('../lib/helpers');
const doradca = require('../lib/doradca');

const router = express.Router();

// Prosty limit zapytań do asystenta — pamięć procesu w zupełności wystarczy
// przy tej skali ruchu i nie wprowadza kolejnej zależności.
const limity = new Map();
function przekroczonyLimit(ip, maks = 12, okno = 10 * 60 * 1000) {
  const teraz = Date.now();
  const wpis = limity.get(ip);
  if (!wpis || teraz - wpis.od > okno) {
    limity.set(ip, { od: teraz, n: 1 });
    return false;
  }
  wpis.n += 1;
  if (limity.size > 500) {
    for (const [k, v] of limity) if (teraz - v.od > okno) limity.delete(k);
  }
  return wpis.n > maks;
}

router.get('/', (req, res) => {
  const all = store.getPublicProperties();
  const active = all.filter((p) => p.status === 'aktywna' || p.status === 'rezerwacja');
  const featured = active.filter((p) => p.featured).slice(0, 3);
  const fill = active.filter((p) => !featured.includes(p)).slice(0, 3 - featured.length);
  const counts = {};
  Object.keys(store.CATEGORIES).forEach((k) => {
    counts[k] = active.filter((p) => p.category === k).length;
  });
  res.render('home', {
    title: null,
    active,
    featured: [...featured, ...fill],
    counts,
    total: active.length
  });
});

router.get('/nieruchomosci', (req, res) => {
  const kategoria = store.CATEGORIES[req.query.kategoria] ? req.query.kategoria : '';
  const typ = store.TRANSACTIONS[req.query.typ] ? req.query.typ : '';
  const szukaj = String(req.query.szukaj || '').trim().slice(0, 120);
  const all = store.getPublicProperties();

  let list = all;
  if (kategoria) list = list.filter((p) => p.category === kategoria);
  if (typ) list = list.filter((p) => p.transaction === typ);
  if (szukaj) {
    const q = szukaj.toLowerCase();
    list = list.filter((p) =>
      [p.title, p.location, p.address, p.id, (p.features || []).join(' ')]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }

  const counts = {};
  Object.keys(store.CATEGORIES).forEach((k) => {
    counts[k] = all.filter((p) => p.category === k).length;
  });

  res.render('listings', {
    title: kategoria ? store.CATEGORIES[kategoria].plural : 'Nieruchomości',
    properties: list,
    filters: { kategoria, typ },
    counts,
    allCount: all.length,
    hasPrices: all.some((p) => p.price)
  });
});

// Asystent doboru. Bez klucza API zwraca dopasowanie lokalne — nigdy 500.
router.post('/api/dobor', async (req, res) => {
  const ip = req.ip || 'nieznane';
  if (przekroczonyLimit(ip)) {
    return res.status(429).json({ error: 'Zbyt wiele zapytań. Spróbuj ponownie za kilka minut.' });
  }

  const zapytanie = String((req.body && req.body.zapytanie) || '').trim();
  if (!zapytanie) {
    return res.json({ error: 'Napisz kilka słów o tym, czego szukasz.' });
  }

  const oferty = store
    .getPublicProperties()
    .filter((p) => p.status === 'aktywna' || p.status === 'rezerwacja');

  try {
    const wynik = await dobierzZTimeoutem(zapytanie, oferty, 25000);
    res.json(wynik);
  } catch (err) {
    console.error('[api/dobor]', err.message);
    res.json({ error: 'Asystent chwilowo niedostępny. Zadzwoń — 600 107 440.' });
  }
});

function dobierzZTimeoutem(zapytanie, oferty, ms) {
  return Promise.race([
    doradca.dobierz(zapytanie, oferty),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

router.get('/nieruchomosci/:slug', (req, res, next) => {
  const property = store.findProperty(req.params.slug);
  if (!property || !store.STATUSES[property.status]?.public) return next();
  const related = store
    .getPublicProperties()
    .filter((p) => p.id !== property.id && (p.category === property.category || p.transaction === property.transaction))
    .slice(0, 3);
  res.render('listing', { title: property.title, property, related });
});

router.get('/o-mnie', (req, res) => {
  res.render('about', { title: 'O mnie' });
});

router.get('/kontakt', (req, res) => {
  res.render('contact', {
    title: 'Kontakt',
    sent: req.query.wyslano === '1',
    error: null,
    form: { temat: req.query.temat || '' }
  });
});

router.post('/kontakt', (req, res) => {
  const { imie, email, telefon, temat, wiadomosc, zgoda, website } = req.body;
  // "website" to pole-pułapka na boty — powinno zostać puste.
  if (website) return res.redirect('/kontakt?wyslano=1');
  const form = { imie, email, telefon, temat, wiadomosc };
  if (!imie || !wiadomosc || (!email && !telefon)) {
    return res.status(400).render('contact', { title: 'Kontakt', sent: false, error: 'Podaj imię, wiadomość oraz e-mail lub telefon.', form });
  }
  if (!zgoda) {
    return res.status(400).render('contact', { title: 'Kontakt', sent: false, error: 'Potrzebna jest zgoda na przetwarzanie danych, żeby móc odpowiedzieć.', form });
  }
  store.addMessage({
    id: h.id(),
    createdAt: new Date().toISOString(),
    read: false,
    imie: String(imie).slice(0, 120),
    email: String(email || '').slice(0, 160),
    telefon: String(telefon || '').slice(0, 40),
    temat: String(temat || '').slice(0, 200),
    wiadomosc: String(wiadomosc).slice(0, 4000)
  });
  res.redirect('/kontakt?wyslano=1');
});

router.get('/polityka-prywatnosci', (req, res) => {
  res.render('privacy', { title: 'Polityka prywatności' });
});

router.get('/robots.txt', (req, res) => {
  const base = store.getSettings().siteUrl || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${base}/sitemap.xml\n`);
});

router.get('/sitemap.xml', (req, res) => {
  const base = (store.getSettings().siteUrl || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const urls = ['/', '/nieruchomosci', '/o-mnie', '/kontakt'].map((u) => ({ loc: base + u }));
  store.getPublicProperties().forEach((p) => urls.push({ loc: `${base}/nieruchomosci/${p.slug}`, lastmod: p.updatedAt }));
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${h.escapeHtml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`).join('\n') +
    '\n</urlset>';
  res.type('application/xml').send(xml);
});

module.exports = router;
