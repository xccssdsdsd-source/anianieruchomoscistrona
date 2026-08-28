# Ania Nieruchomości — strona + panel administracyjny

Strona personalna pośrednika nieruchomości (Rzeszów) z panelem do zarządzania ofertami,
treściami i zdjęciami. Bez bazy danych — wszystko w plikach JSON i folderze `public/uploads`.

## Uruchomienie

```bash
cd app
npm install
npm start
```

- Strona: http://localhost:3000
- Panel: http://localhost:3000/admin — hasło domyślne `ania2026` (zmień od razu w panelu → Hasło)

Zmienne środowiskowe (opcjonalne): `PORT` (domyślnie 3000), `ADMIN_PASSWORD` (hasło domyślne, dopóki nie ustawisz własnego w panelu).

## Co jest w panelu

| Sekcja | Co można zrobić |
|---|---|
| Pulpit | statystyki, ostatnie wiadomości, lista braków do uzupełnienia |
| Nieruchomości | dodawanie / edycja / duplikowanie / usuwanie ofert, zdjęcia (upload, kolejność przeciąganiem, podpisy), status (aktywna, rezerwacja, sprzedana, wynajęta, ukryta), wyróżnienie na stronie głównej, dowolne dodatkowe parametry |
| Wiadomości | zapytania z formularza kontaktowego (oznaczanie, usuwanie) |
| Ustawienia | nazwa, imię i nazwisko, telefony, e-mail, adres biura, social, teksty strony głównej i „O mnie”, usługi, kroki współpracy, zdjęcia (hero, portret, o mnie, 6 kafelków Instagram), SEO |
| Hasło | zmiana hasła (scrypt, plik `data/auth.json`) |
| Pobierz kopię danych | eksport JSON wszystkich danych |

## Struktura

```
app/
  server.js              start serwera (Express + EJS)
  src/lib/store.js       odczyt/zapis JSON, domyślne ustawienia, słowniki (kategorie, statusy)
  src/lib/auth.js        logowanie, ciasteczko sesji, hasło
  src/lib/helpers.js     formatowanie cen, slugi, daty
  src/routes/public.js   strona publiczna, formularz, robots, sitemap
  src/routes/admin.js    panel (CRUD, upload zdjęć)
  views/                 szablony EJS (partials/ = nagłówek, stopka, karta oferty, placeholder)
  public/css/site.css    style strony (tokeny w :root)
  public/css/admin.css   style panelu
  public/js/             menu, animacje, galeria, panel
  public/uploads/        zdjęcia wgrane przez panel (kopiuj razem z data/ przy przenosinach)
  data/                  properties.json, site.json, messages.json, auth.json, .secret
```

## Placeholdery zdjęć

Każde miejsce na zdjęcie to komponent `views/partials/placeholder.ejs`. Dopóki nie ma pliku,
wyświetla ramkę z etykietą i sugerowanym formatem. Zdjęcia wgrywasz w panelu:

- **Ustawienia → Zdjęcia**: zdjęcie główne (hero, pion 3:4), portret (kwadrat), portret na „O mnie” (4:5), 6 kafelków Instagram.
- **Nieruchomości → oferta → Zdjęcia**: galeria oferty (pierwsze = główne, 16:10; reszta 4:3).
- Placeholdery bez pola w panelu (na razie): zdjęcia „Z życia zawodowego” na stronie „O mnie”, mapa okolicy na ofercie, mapa biura na kontakcie — do podmiany w kodzie lub rozbudowy panelu.

Teksty oznaczone `[…]` na pomarańczowo to placeholdery treści — znikają, gdy uzupełnisz pole w Ustawieniach.

## Rozbudowa

- Nowa kategoria nieruchomości: dodaj wpis w `CATEGORIES` w `src/lib/store.js` — filtry, panel i stopka podchwycą automatycznie.
- Nowy status: `STATUSES` tamże (`public: false` = niewidoczny na stronie).
- Nowa sekcja/strona: trasa w `src/routes/public.js` + widok w `views/`, teksty przez `settings` (dodaj klucz w `DEFAULT_SETTINGS` i pole w `views/admin/settings.ejs`).
- Wysyłka e-maili z formularza: `store.addMessage` w `public.js` — tam dołóż np. Nodemailer/Resend.

## Publikacja

Aplikacja Node — działa na dowolnym hostingu z Node 18+ (Render, Railway, Fly.io, mikr.us, VPS z PM2).
Przed publikacją: zmień hasło, ustaw `siteUrl` w Ustawieniach → SEO, uzupełnij politykę prywatności o dane firmy.
Backup = kopia folderów `data/` i `public/uploads/`.
