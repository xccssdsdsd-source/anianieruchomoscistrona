// Asystent doboru nieruchomości.
// Z kluczem ANTHROPIC_API_KEY korzysta z modelu Claude; bez klucza działa
// lokalny, deterministyczny scorer — funkcja nigdy nie zwraca błędu z tego
// powodu i nigdy nie udaje AI, gdy AI nie działa.
const Anthropic = require('@anthropic-ai/sdk');
const helpers = require('./helpers');

const MODEL = 'claude-opus-5';
const MAX_ZAPYTANIE = 600;
const MAX_DOPASOWAN = 4;

let klient = null;
function getKlient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!klient) {
    const Ctor = Anthropic.default || Anthropic;
    klient = new Ctor();
  }
  return klient;
}

function maAI() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Zwięzły katalog dla modelu — tylko to, co realnie pomaga w dopasowaniu.
function katalog(oferty) {
  return oferty.map((p) => ({
    id: p.id,
    tytul: p.title,
    kategoria: p.category,
    transakcja: p.transaction,
    lokalizacja: helpers.isPlaceholderText(p.location) ? helpers.cleanLocation(p.location) : p.location,
    powierzchnia: helpers.areaFor(p),
    cena: p.price ? helpers.formatPrice(p.price) : 'na zapytanie',
    pokoje: p.rooms || undefined,
    atuty: (p.features || []).slice(0, 8),
    szczegoly: (p.extras || [])
      .filter((e) => e && e.label && e.value && !helpers.isPlaceholderText(e.value))
      .slice(0, 6)
      .map((e) => `${e.label}: ${e.value}`)
  }));
}

const NARZEDZIE = {
  name: 'zwroc_dopasowania',
  description: 'Zwraca uporządkowaną listę ofert najlepiej pasujących do opisu klienta.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      dopasowania: {
        type: 'array',
        description: 'Oferty od najlepiej do najsłabiej dopasowanej. Pusta lista, jeśli nic nie pasuje.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', description: 'Identyfikator oferty z katalogu.' },
            uzasadnienie: {
              type: 'string',
              description: 'Jedno zdanie po polsku: dlaczego ta oferta pasuje do opisu klienta.'
            }
          },
          required: ['id', 'uzasadnienie']
        }
      }
    },
    required: ['dopasowania']
  }
};

const SYSTEM = `Jesteś asystentem biura nieruchomości „Ania Nieruchomości" z Rzeszowa.
Twoim zadaniem jest dopasowanie ofert z katalogu do opisu klienta.

Zasady:
- Wybieraj WYŁĄCZNIE oferty z podanego katalogu, po ich dokładnym "id".
- Nigdy nie wymyślaj nieruchomości, cen ani parametrów, których nie ma w katalogu.
- Maksymalnie ${MAX_DOPASOWAN} oferty, od najlepiej dopasowanej.
- Jeśli nic sensownie nie pasuje, zwróć pustą listę. Lepiej nic niż dopasowanie na siłę.
- Uzasadnienie: jedno rzeczowe zdanie po polsku, odnoszące się do tego, o co prosił klient.
  Bez marketingowej waty, bez wykrzykników.
- Zawsze wywołaj narzędzie zwroc_dopasowania.`;

// Lokalny scorer — prosty, przewidywalny, bez żadnych obietnic „AI".
function dopasujLokalnie(zapytanie, oferty) {
  const norm = (s) => String(s || '')
    .toLowerCase()
    .replace(/[ąĄ]/g, 'a').replace(/[ćĆ]/g, 'c').replace(/[ęĘ]/g, 'e')
    .replace(/[łŁ]/g, 'l').replace(/[ńŃ]/g, 'n').replace(/[óÓ]/g, 'o')
    .replace(/[śŚ]/g, 's').replace(/[źŹżŻ]/g, 'z');

  const q = norm(zapytanie);
  const slowa = q.split(/[^a-z0-9]+/).filter((w) => w.length > 3);

  const kategorie = {
    dzialka: ['dzialka', 'dzialke', 'dzialki', 'grunt', 'ziemia', 'siedlisko', 'parcela'],
    dom: ['dom', 'domu', 'domek', 'willa', 'blizniak'],
    mieszkanie: ['mieszkanie', 'mieszkania', 'kawalerka', 'apartament', 'lokum'],
    komercja: ['lokal', 'komercyjny', 'biuro', 'hala', 'magazyn', 'sklep', 'uslugowy']
  };
  const transakcje = {
    wynajem: ['wynajem', 'wynajac', 'wynajmu', 'najem', 'do wynajecia'],
    sprzedaz: ['kupic', 'kupno', 'zakup', 'sprzedaz', 'na wlasnosc']
  };

  const trafKat = Object.keys(kategorie).find((k) => kategorie[k].some((w) => q.includes(w)));
  const trafTyp = Object.keys(transakcje).find((k) => transakcje[k].some((w) => q.includes(w)));

  const wyniki = oferty.map((p) => {
    let punkty = 0;
    const powody = [];

    if (trafKat && p.category === trafKat) { punkty += 6; powody.push('zgodny typ nieruchomości'); }
    if (trafTyp && p.transaction === trafTyp) { punkty += 3; powody.push('zgodny rodzaj transakcji'); }

    const tekst = norm([p.title, p.location, p.address, (p.features || []).join(' '),
      (p.extras || []).map((e) => e && e.value).join(' '), p.description].join(' '));
    const trafione = slowa.filter((w) => tekst.includes(w));
    punkty += trafione.length * 2;
    if (trafione.length) powody.push('pasujące słowa: ' + trafione.slice(0, 3).join(', '));

    return { p, punkty, powody };
  });

  return wyniki
    .filter((w) => w.punkty > 0)
    .sort((a, b) => b.punkty - a.punkty)
    .slice(0, MAX_DOPASOWAN)
    .map((w) => ({
      id: w.p.id,
      uzasadnienie: w.powody.length
        ? 'Dopasowanie lokalne — ' + w.powody.join(', ') + '.'
        : 'Oferta z aktualnej listy.'
    }));
}

async function dopasujModelem(zapytanie, oferty) {
  const c = getKlient();
  const odp = await c.messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: 'low' },
    system: [
      { type: 'text', text: SYSTEM },
      {
        type: 'text',
        text: 'KATALOG OFERT:\n' + JSON.stringify(katalog(oferty), null, 1),
        cache_control: { type: 'ephemeral' }
      }
    ],
    tools: [NARZEDZIE],
    tool_choice: { type: 'tool', name: 'zwroc_dopasowania' },
    messages: [{ role: 'user', content: 'Opis klienta:\n' + zapytanie }]
  });

  if (odp.stop_reason === 'refusal') return [];

  const blok = (odp.content || []).find((b) => b.type === 'tool_use');
  if (!blok || !blok.input) return [];
  const lista = Array.isArray(blok.input.dopasowania) ? blok.input.dopasowania : [];
  return lista.slice(0, MAX_DOPASOWAN);
}

/**
 * Dopasowuje oferty do opisu klienta.
 * @returns {Promise<{mode:string, modeLabel:string, matches:Array}>}
 */
async function dobierz(zapytanie, oferty) {
  const q = String(zapytanie || '').trim().slice(0, MAX_ZAPYTANIE);
  if (!q) return { mode: 'pusty', modeLabel: '', matches: [] };

  let surowe = [];
  let mode = 'offline';

  if (maAI()) {
    try {
      surowe = await dopasujModelem(q, oferty);
      mode = 'ai';
    } catch (err) {
      console.error('[doradca] model niedostępny, przechodzę na dopasowanie lokalne:', err.message);
      surowe = dopasujLokalnie(q, oferty);
      mode = 'offline-fallback';
    }
  } else {
    surowe = dopasujLokalnie(q, oferty);
  }

  // Renderujemy wyłącznie oferty odnalezione po id — model nie jest w stanie
  // wprowadzić do wyniku nieruchomości, której nie ma w katalogu.
  const wgId = new Map(oferty.map((p) => [p.id, p]));
  const matches = surowe
    .map((m) => {
      const p = wgId.get(m.id);
      if (!p) return null;
      return {
        id: p.id,
        title: p.title,
        url: '/nieruchomosci/' + p.slug,
        reason: String(m.uzasadnienie || '').slice(0, 300)
      };
    })
    .filter(Boolean);

  const etykiety = {
    ai: 'Dopasowanie przygotowane przez asystenta AI',
    offline: 'Dopasowanie lokalne — asystent AI po podłączeniu klucza',
    'offline-fallback': 'Dopasowanie lokalne — asystent AI chwilowo niedostępny'
  };

  return { mode, modeLabel: etykiety[mode] || '', matches };
}

module.exports = { dobierz, maAI, MAX_ZAPYTANIE };
