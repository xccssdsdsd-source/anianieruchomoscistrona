// Panel administracyjny: logowanie, nieruchomości, ustawienia, wiadomości.
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const store = require('../lib/store');
const auth = require('../lib/auth');
const h = require('../lib/helpers');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');

// ---- Upload zdjęć --------------------------------------------------------
const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = req.uploadFolder || 'strona';
    const dir = path.join(UPLOAD_DIR, folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const base = h.slugify(path.parse(file.originalname).name).slice(0, 40) || 'zdjecie';
    cb(null, `${Date.now()}-${base}${ALLOWED[file.mimetype]}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 30 },
  fileFilter(req, file, cb) {
    cb(null, Boolean(ALLOWED[file.mimetype]));
  }
});
const publicPath = (file) => '/uploads/' + path.relative(UPLOAD_DIR, file.path).split(path.sep).join('/');

function removeFile(publicUrl) {
  if (!publicUrl || !publicUrl.startsWith('/uploads/')) return;
  const abs = path.join(UPLOAD_DIR, publicUrl.replace('/uploads/', ''));
  fs.rm(abs, { force: true }, () => {});
}

// ---- Widoki panelu: wspólne dane ----------------------------------------
router.use((req, res, next) => {
  res.locals.admin = true;
  res.locals.defaultPassword = auth.usesDefaultPassword();
  res.locals.unread = store.getMessages().filter((m) => !m.read).length;
  next();
});

// ---- Logowanie -----------------------------------------------------------
router.get('/login', (req, res) => {
  if (auth.isLoggedIn(req)) return res.redirect('/admin');
  res.render('admin/login', { title: 'Logowanie', error: null, next: req.query.next || '/admin' });
});

router.post('/login', (req, res) => {
  const next = String(req.body.next || '/admin');
  const safeNext = next.startsWith('/admin') ? next : '/admin';
  if (auth.verifyPassword(String(req.body.password || ''))) {
    auth.login(res);
    return res.redirect(safeNext);
  }
  res.status(401).render('admin/login', { title: 'Logowanie', error: 'Nieprawidłowe hasło.', next: safeNext });
});

router.post('/logout', (req, res) => {
  auth.logout(res);
  res.redirect('/admin/login');
});

router.use(auth.requireAuth);

// ---- Pulpit --------------------------------------------------------------
router.get('/', (req, res) => {
  const props = store.getProperties();
  const messages = store.getMessages();
  res.render('admin/dashboard', {
    title: 'Pulpit',
    stats: {
      total: props.length,
      active: props.filter((p) => p.status === 'aktywna').length,
      hidden: props.filter((p) => p.status === 'ukryta').length,
      noPhotos: props.filter((p) => !p.images || p.images.length === 0).length,
      messages: messages.length,
      unread: messages.filter((m) => !m.read).length
    },
    recentMessages: messages.slice(0, 5),
    recentProps: [...props].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5)
  });
});

// ---- Nieruchomości -------------------------------------------------------
router.get('/nieruchomosci', (req, res) => {
  const list = [...store.getProperties()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.render('admin/properties', { title: 'Nieruchomości', properties: list, saved: req.query.zapisano === '1' });
});

const emptyProperty = () => ({
  id: null,
  slug: '',
  title: '',
  category: 'mieszkanie',
  transaction: 'sprzedaz',
  status: 'ukryta',
  featured: false,
  price: null,
  priceNote: '',
  location: '',
  address: '',
  area: null,
  rooms: null,
  floor: '',
  year: '',
  plotArea: null,
  extras: [],
  features: [],
  description: '',
  images: []
});

router.get('/nieruchomosci/nowa', (req, res) => {
  res.render('admin/property-form', { title: 'Nowa nieruchomość', property: emptyProperty(), isNew: true, error: null });
});

router.get('/nieruchomosci/:id', (req, res, next) => {
  const property = store.findProperty(req.params.id);
  if (!property) return next();
  res.render('admin/property-form', { title: property.title, property, isNew: false, error: null, saved: req.query.zapisano === '1' });
});

function setUploadFolder(req, res, next) {
  const existing = req.params.id !== 'nowa' ? store.findProperty(req.params.id) : null;
  req.uploadFolder = 'oferty/' + (existing ? existing.id : (req.newId = h.id()));
  next();
}

router.post('/nieruchomosci/:id', setUploadFolder, upload.array('images', 30), (req, res, next) => {
  const isNew = req.params.id === 'nowa';
  const existing = isNew ? null : store.findProperty(req.params.id);
  if (!isNew && !existing) return next();
  const b = req.body;

  const extrasLabels = [].concat(b.extraLabel || []);
  const extrasValues = [].concat(b.extraValue || []);
  const extras = extrasLabels
    .map((label, i) => ({ label: String(label).trim(), value: String(extrasValues[i] || '').trim() }))
    .filter((e) => e.label && e.value);

  const features = String(b.features || '')
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Kolejność i podpisy istniejących zdjęć przychodzą jako listy równoległe.
  const keepFiles = [].concat(b.imageFile || []);
  const keepAlts = [].concat(b.imageAlt || []);
  const keptImages = keepFiles.map((file, i) => ({ file, alt: String(keepAlts[i] || '').trim() }));
  const removedImages = (existing?.images || []).filter((img) => !keepFiles.includes(img.file));
  removedImages.forEach((img) => removeFile(img.file));
  const newImages = (req.files || []).map((f) => ({ file: publicPath(f), alt: '' }));

  const all = store.getProperties();
  const id = existing ? existing.id : req.newId;
  const baseSlug = h.slugify(b.slug || b.title);
  const now = new Date().toISOString();

  const property = {
    ...(existing || emptyProperty()),
    id,
    slug: h.uniqueSlug(baseSlug, all, id),
    title: String(b.title || '').trim() || 'Bez tytułu',
    category: store.CATEGORIES[b.category] ? b.category : 'mieszkanie',
    transaction: store.TRANSACTIONS[b.transaction] ? b.transaction : 'sprzedaz',
    status: store.STATUSES[b.status] ? b.status : 'ukryta',
    featured: b.featured === 'on',
    price: h.num(b.price),
    priceNote: String(b.priceNote || '').trim(),
    location: String(b.location || '').trim(),
    address: String(b.address || '').trim(),
    area: h.num(b.area),
    rooms: h.num(b.rooms),
    floor: String(b.floor || '').trim(),
    year: String(b.year || '').trim(),
    plotArea: h.num(b.plotArea),
    extras,
    features,
    description: String(b.description || '').replace(/\r\n/g, '\n').trim(),
    images: [...keptImages, ...newImages],
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  store.upsertProperty(property);
  res.redirect(`/admin/nieruchomosci/${property.id}?zapisano=1`);
});

router.post('/nieruchomosci/:id/usun', (req, res, next) => {
  const property = store.findProperty(req.params.id);
  if (!property) return next();
  (property.images || []).forEach((img) => removeFile(img.file));
  fs.rm(path.join(UPLOAD_DIR, 'oferty', property.id), { recursive: true, force: true }, () => {});
  store.deleteProperty(property.id);
  res.redirect('/admin/nieruchomosci');
});

router.post('/nieruchomosci/:id/duplikuj', (req, res, next) => {
  const property = store.findProperty(req.params.id);
  if (!property) return next();
  const now = new Date().toISOString();
  const id = h.id();
  const copy = {
    ...property,
    id,
    slug: h.uniqueSlug(property.slug + '-kopia', store.getProperties(), id),
    title: property.title + ' (kopia)',
    status: 'ukryta',
    featured: false,
    images: [],
    createdAt: now,
    updatedAt: now
  };
  store.upsertProperty(copy);
  res.redirect(`/admin/nieruchomosci/${id}`);
});

// ---- Ustawienia strony ---------------------------------------------------
const settingsUpload = upload.fields([
  { name: 'heroImage', maxCount: 1 },
  { name: 'portraitImage', maxCount: 1 },
  { name: 'aboutImage', maxCount: 1 },
  { name: 'instagramImages', maxCount: 6 }
]);

router.get('/ustawienia', (req, res) => {
  res.render('admin/settings', { title: 'Ustawienia strony', saved: req.query.zapisano === '1' });
});

router.post(
  '/ustawienia',
  (req, res, next) => {
    req.uploadFolder = 'strona';
    next();
  },
  settingsUpload,
  (req, res) => {
    const b = req.body;
    const current = store.getSettings();
    const files = req.files || {};
    const text = (k) => String(b[k] ?? current[k] ?? '').replace(/\r\n/g, '\n').trim();

    const pairList = (labelKey, valueKey, fields) => {
      const a = [].concat(b[labelKey] || []);
      const c = [].concat(b[valueKey] || []);
      return a.map((x, i) => ({ [fields[0]]: String(x).trim(), [fields[1]]: String(c[i] || '').trim() })).filter((o) => o[fields[0]]);
    };

    const patch = {
      brandName: text('brandName'),
      ownerName: text('ownerName'),
      ownerFullName: text('ownerFullName'),
      tagline: text('tagline'),
      heroTitle: text('heroTitle'),
      heroLead: text('heroLead'),
      phone: text('phone'),
      phoneSecondary: text('phoneSecondary'),
      email: text('email'),
      officeAddress: text('officeAddress'),
      officeHours: text('officeHours'),
      instagram: text('instagram'),
      facebook: text('facebook'),
      linkedin: text('linkedin'),
      aboutIntro: text('aboutIntro'),
      aboutBody: text('aboutBody'),
      aboutFacts: pairList('factLabel', 'factValue', ['label', 'value']),
      processSteps: pairList('stepTitle', 'stepText', ['title', 'text']),
      services: pairList('serviceTitle', 'serviceText', ['title', 'text']),
      ctaTitle: text('ctaTitle'),
      ctaText: text('ctaText'),
      metaDescription: text('metaDescription'),
      siteUrl: text('siteUrl').replace(/\/$/, '')
    };

    ['heroImage', 'portraitImage', 'aboutImage'].forEach((key) => {
      if (files[key]?.[0]) {
        removeFile(current[key]);
        patch[key] = publicPath(files[key][0]);
      } else if (b[`remove_${key}`] === 'on') {
        removeFile(current[key]);
        patch[key] = '';
      }
    });

    const keptIg = [].concat(b.instagramKeep || []);
    (current.instagramImages || []).filter((f) => !keptIg.includes(f)).forEach(removeFile);
    const newIg = (files.instagramImages || []).map(publicPath);
    patch.instagramImages = [...keptIg, ...newIg].slice(0, 6);

    store.saveSettings(patch);
    res.redirect('/admin/ustawienia?zapisano=1');
  }
);

// ---- Hasło ---------------------------------------------------------------
router.get('/haslo', (req, res) => {
  res.render('admin/password', { title: 'Zmiana hasła', error: null, saved: req.query.zapisano === '1' });
});

router.post('/haslo', (req, res) => {
  const { current, password, confirm } = req.body;
  if (!auth.verifyPassword(String(current || ''))) {
    return res.status(400).render('admin/password', { title: 'Zmiana hasła', error: 'Obecne hasło jest nieprawidłowe.', saved: false });
  }
  if (!password || password.length < 8) {
    return res.status(400).render('admin/password', { title: 'Zmiana hasła', error: 'Nowe hasło musi mieć co najmniej 8 znaków.', saved: false });
  }
  if (password !== confirm) {
    return res.status(400).render('admin/password', { title: 'Zmiana hasła', error: 'Hasła nie są identyczne.', saved: false });
  }
  auth.setPassword(password);
  res.redirect('/admin/haslo?zapisano=1');
});

// ---- Wiadomości ----------------------------------------------------------
router.get('/wiadomosci', (req, res) => {
  res.render('admin/messages', { title: 'Wiadomości', messages: store.getMessages() });
});

router.post('/wiadomosci/:id/przeczytana', (req, res) => {
  const list = store.getMessages().map((m) => (m.id === req.params.id ? { ...m, read: !m.read } : m));
  store.updateMessages(list);
  res.redirect('/admin/wiadomosci');
});

router.post('/wiadomosci/:id/usun', (req, res) => {
  store.updateMessages(store.getMessages().filter((m) => m.id !== req.params.id));
  res.redirect('/admin/wiadomosci');
});

// ---- Eksport danych (backup) --------------------------------------------
router.get('/eksport', (req, res) => {
  res.setHeader('Content-Disposition', `attachment; filename="ania-nieruchomosci-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({ settings: store.getSettings(), properties: store.getProperties(), messages: store.getMessages() });
});

module.exports = router;
