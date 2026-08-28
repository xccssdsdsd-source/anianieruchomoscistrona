// Prosty magazyn danych oparty o pliki JSON w katalogu /data.
// Bez bazy danych — łatwy backup (kopia folderu), łatwa migracja później.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function read(name, fallback) {
  try {
    const raw = fs.readFileSync(filePath(name), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function write(name, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = filePath(name) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath(name));
}

// ---- Ustawienia strony ----------------------------------------------------
const DEFAULT_SETTINGS = {
  brandName: 'Ania Nieruchomości',
  ownerName: 'Ania',
  ownerFullName: '',
  tagline: 'Nieruchomości · Rzeszów · Kupno · Sprzedaż · Wynajem',
  heroTitle: 'Nieruchomości w Rzeszowie i na Podkarpaciu.',
  heroLead: 'Pomagam kupić, sprzedać i wynająć mieszkania, domy, działki i lokale komercyjne — od pierwszej rozmowy do podpisania umowy.',
  phone: '600 107 440',
  phoneSecondary: '729 960 454',
  email: '',
  officeAddress: '',
  officeHours: 'Pon.–Pt. 9:00–18:00, sobota po umówieniu',
  instagram: 'https://www.instagram.com/ania.nieruchomosci/',
  facebook: '',
  linkedin: '',
  aboutIntro: 'Cześć, jestem Ania.',
  aboutBody: '',
  aboutFacts: [
    { label: 'Obszar', value: 'Rzeszów i okolice, Podkarpacie' },
    { label: 'Specjalizacja', value: 'Mieszkania, domy, działki, komercja' },
    { label: 'W branży od', value: '' }
  ],
  processSteps: [
    { title: 'Rozmowa i wycena', text: 'Poznaję nieruchomość albo Twoje oczekiwania. Mówię wprost, ile realnie można uzyskać i jak długo może to potrwać.' },
    { title: 'Przygotowanie oferty', text: 'Zdjęcia, opis, publikacja w portalach i na moim Instagramie. Umawiam i prowadzę prezentacje.' },
    { title: 'Negocjacje i umowa', text: 'Prowadzę negocjacje, pilnuję dokumentów i terminów. Jestem z Tobą u notariusza i przy przekazaniu kluczy.' }
  ],
  services: [
    { title: 'Sprzedaż', text: 'Przygotowanie, promocja i sprzedaż nieruchomości w Rzeszowie i okolicach.' },
    { title: 'Kupno', text: 'Szukam nieruchomości pod Twoje kryteria — także takich, które nie trafiają do portali.' },
    { title: 'Wynajem', text: 'Obsługa wynajmu od znalezienia najemcy po umowę i protokół zdawczo-odbiorczy.' },
    { title: 'Komercja', text: 'Lokale, biura, hale i grunty inwestycyjne — sprzedaż i wynajem.' }
  ],
  ctaTitle: 'Masz nieruchomość do sprzedania albo szukasz swojej?',
  ctaText: 'Zadzwoń albo napisz. Odpowiadam tego samego dnia.',
  heroImage: '',
  portraitImage: '',
  aboutImage: '',
  instagramImages: [],
  metaDescription: 'Ania Nieruchomości — pośrednik nieruchomości w Rzeszowie. Mieszkania, domy, działki i lokale komercyjne. Kupno, sprzedaż, wynajem.',
  siteUrl: ''
};

function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read('site', {}) };
}

function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  write('site', next);
  return next;
}

// ---- Nieruchomości -------------------------------------------------------
const CATEGORIES = {
  mieszkanie: { label: 'Mieszkanie', plural: 'Mieszkania' },
  dom: { label: 'Dom', plural: 'Domy' },
  dzialka: { label: 'Działka', plural: 'Działki' },
  komercja: { label: 'Komercja', plural: 'Komercja' }
};

const TRANSACTIONS = {
  sprzedaz: { label: 'Sprzedaż', short: 'Na sprzedaż' },
  wynajem: { label: 'Wynajem', short: 'Na wynajem' }
};

const STATUSES = {
  aktywna: { label: 'Aktywna', public: true },
  rezerwacja: { label: 'Rezerwacja', public: true },
  sprzedana: { label: 'Sprzedana', public: true },
  wynajeta: { label: 'Wynajęta', public: true },
  ukryta: { label: 'Ukryta (szkic)', public: false }
};

function getProperties() {
  return read('properties', []);
}

function saveProperties(list) {
  write('properties', list);
}

function getPublicProperties() {
  return getProperties()
    .filter((p) => STATUSES[p.status] && STATUSES[p.status].public)
    .sort((a, b) => {
      if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

function findProperty(idOrSlug) {
  return getProperties().find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

function upsertProperty(prop) {
  const list = getProperties();
  const idx = list.findIndex((p) => p.id === prop.id);
  if (idx === -1) list.push(prop);
  else list[idx] = prop;
  saveProperties(list);
  return prop;
}

function deleteProperty(id) {
  saveProperties(getProperties().filter((p) => p.id !== id));
}

// ---- Wiadomości z formularza --------------------------------------------
function getMessages() {
  return read('messages', []);
}

function addMessage(msg) {
  const list = getMessages();
  list.unshift(msg);
  write('messages', list.slice(0, 500));
}

function updateMessages(list) {
  write('messages', list);
}

module.exports = {
  DATA_DIR,
  CATEGORIES,
  TRANSACTIONS,
  STATUSES,
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  getProperties,
  getPublicProperties,
  findProperty,
  upsertProperty,
  deleteProperty,
  saveProperties,
  getMessages,
  addMessage,
  updateMessages
};
