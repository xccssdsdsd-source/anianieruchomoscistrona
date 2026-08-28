// Ania Nieruchomości — serwer strony + panel administracyjny.
// Uruchomienie: npm start  (domyślnie http://localhost:3000)
const fs = require('fs');
const path = require('path');
const express = require('express');

const store = require('./src/lib/store');
const helpers = require('./src/lib/helpers');
const { isLoggedIn, sameOrigin } = require('./src/lib/auth');
const publicRoutes = require('./src/routes/public');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');
app.set('trust proxy', 1);

const isProd = process.env.NODE_ENV === 'production';

// Znacznik wersji pliku statycznego (mtime) — doklejany jako ?v=…
// Dzięki temu po wdrożeniu przeglądarka bierze nowy CSS/JS, a nie kopię sprzed tygodnia.
const assetVersion = (publicPath) => {
  try {
    const abs = path.join(__dirname, 'public', publicPath.replace(/^\//, ''));
    return String(Math.floor(fs.statSync(abs).mtimeMs));
  } catch {
    return '0';
  }
};

app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: isProd ? '7d' : 0 }));
app.use(sameOrigin);

// Dane wspólne dla wszystkich widoków.
app.use((req, res, next) => {
  res.locals.settings = store.getSettings();
  res.locals.h = helpers;
  res.locals.C = store.CATEGORIES;
  res.locals.T = store.TRANSACTIONS;
  res.locals.S = store.STATUSES;
  res.locals.path = req.path;
  res.locals.isAdmin = isLoggedIn(req);
  res.locals.flash = null;
  res.locals.v = (p) => `${p}?v=${assetVersion(p)}`;
  next();
});

app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

app.use((req, res) => {
  res.status(404).render('404', { title: 'Nie znaleziono strony' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Plik jest za duży (maks. 15 MB).' : err.message || 'Wystąpił błąd.';
  res.status(err.status || 500).render('404', { title: 'Błąd', message: msg });
});

app.listen(PORT, () => {
  console.log(`Strona:  http://localhost:${PORT}`);
  console.log(`Panel:   http://localhost:${PORT}/admin`);
});
