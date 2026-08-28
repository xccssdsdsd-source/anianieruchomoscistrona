// Funkcje pomocnicze używane w widokach i trasach.
const crypto = require('crypto');

function slugify(text) {
  const map = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };
  return (
    String(text || '')
      .toLowerCase()
      .replace(/[ąćęłńóśźż]/g, (c) => map[c])
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'oferta'
  );
}

function uniqueSlug(base, existing, ownId) {
  let slug = base;
  let i = 2;
  const taken = (s) => existing.some((p) => p.slug === s && p.id !== ownId);
  while (taken(slug)) slug = `${base}-${i++}`;
  return slug;
}

function id() {
  return crypto.randomBytes(6).toString('hex');
}

function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

function fmt(n, opts) {
  return n.toLocaleString('pl-PL', opts).replace(/ /g, ' ');
}

function formatPrice(value) {
  const n = num(value);
  if (n === null) return null;
  return fmt(n) + ' zł';
}

function formatArea(value) {
  const n = num(value);
  if (n === null) return null;
  return fmt(n, { maximumFractionDigits: 1 }) + ' m²';
}

function pricePerM2(price, area) {
  const p = num(price);
  const a = num(area);
  if (!p || !a) return null;
  return fmt(Math.round(p / a)) + ' zł/m²';
}

function paragraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function telHref(phone) {
  const digits = String(phone || '').replace(/\D/g, '').replace(/^48/, '');
  return 'tel:+48' + digits;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

// Powierzchnię gruntu rynek podaje w arach i hektarach, nie w metrach.
// 5066 m² → „50,66 a”, 11 000 m² → „1,10 ha”.
function formatLandArea(value) {
  const n = num(value);
  if (n === null) return null;
  if (n >= 10000) return fmt(n / 10000, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + ' ha';
  if (n >= 1000) return fmt(n / 100, { maximumFractionDigits: 2 }) + ' a';
  return formatArea(n);
}

// Powierzchnia właściwa dla kategorii — działki w arach/hektarach, reszta w m².
function areaFor(property) {
  if (!property) return null;
  return property.category === 'dzialka'
    ? formatLandArea(property.area)
    : formatArea(property.area);
}

// Rozpoznaje teksty-zaślepki wprowadzone w panelu („… do uzupełnienia”,
// „[do ustalenia]”), żeby szablon pokazał skeleton zamiast drukować je wprost.
const PLACEHOLDER_RE = /\b(do uzupe[łl]nienia|do ustalenia|do potwierdzenia|uzupe[łl]ni[ćc])\b/i;

function isPlaceholderText(text) {
  const s = String(text || '').trim();
  if (!s) return true;
  if (s.startsWith('[') && s.endsWith(']')) return true;
  return PLACEHOLDER_RE.test(s);
}

// Zwraca część lokalizacji sprzed myślnika, o ile reszta to zaślepka.
// „Podkarpacie — dokładna lokalizacja do uzupełnienia” → „Podkarpacie”.
function cleanLocation(text) {
  const s = String(text || '').trim();
  if (!s) return '';
  if (!isPlaceholderText(s)) return s;
  const head = s.split(/\s+[—–-]\s+/)[0].trim();
  return head && !isPlaceholderText(head) ? head : '';
}

module.exports = {
  slugify, uniqueSlug, id, num, formatPrice, formatArea, pricePerM2,
  paragraphs, escapeHtml, telHref, formatDate,
  formatLandArea, areaFor, isPlaceholderText, cleanLocation
};
