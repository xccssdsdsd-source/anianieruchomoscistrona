// Logowanie do panelu: hasło (scrypt) + podpisane ciasteczko sesji (HMAC).
// Sekret i hash hasła trzymane w /data — nie trafiają do kodu.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./store');

const COOKIE = 'ania_admin';
const SESSION_DAYS = 14;
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'ania2026';

function getSecret() {
  const file = path.join(DATA_DIR, '.secret');
  try {
    return fs.readFileSync(file, 'utf8').trim();
  } catch {
    const secret = crypto.randomBytes(32).toString('hex');
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, secret, 'utf8');
    return secret;
  }
}

function authFile() {
  return path.join(DATA_DIR, 'auth.json');
}

function readAuth() {
  try {
    return JSON.parse(fs.readFileSync(authFile(), 'utf8'));
  } catch {
    return null;
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function usesDefaultPassword() {
  return readAuth() === null;
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function verifyPassword(password) {
  const stored = readAuth();
  if (!stored) return safeEqual(password, DEFAULT_PASSWORD);
  const { hash } = hashPassword(password, stored.salt);
  return safeEqual(hash, stored.hash);
}

function setPassword(password) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(authFile(), JSON.stringify(hashPassword(password), null, 2), 'utf8');
}

function sign(payload) {
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const idx = token.lastIndexOf('.');
  if (idx === -1) return false;
  const payload = token.slice(0, idx);
  if (!safeEqual(token, sign(payload))) return false;
  const exp = Number(payload.split(':')[1]);
  return exp > Date.now();
}

function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i === -1) return;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function login(res) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const token = sign(`admin:${Date.now() + maxAge * 1000}`);
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`);
}

function logout(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function isLoggedIn(req) {
  return verifyToken(parseCookies(req.headers.cookie)[COOKIE]);
}

function requireAuth(req, res, next) {
  if (isLoggedIn(req)) return next();
  res.redirect('/admin/login?next=' + encodeURIComponent(req.originalUrl));
}

// Prosta ochrona CSRF: żądania POST muszą pochodzić z tej samej domeny.
function sameOrigin(req, res, next) {
  if (req.method !== 'POST') return next();
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return next();
  try {
    if (new URL(origin).host === req.headers.host) return next();
  } catch {}
  res.status(403).send('Nieprawidłowe źródło żądania.');
}

module.exports = { login, logout, isLoggedIn, requireAuth, sameOrigin, verifyPassword, setPassword, usesDefaultPassword };
