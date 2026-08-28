# Strona ania.nieruchomosci — folder roboczy

## Struktura

- `app/` — **gotowa strona z panelem administracyjnym** (Node.js + Express). Instrukcja uruchomienia i opis panelu w `app/README.md`.
- `dane-zrodlowe/profil-instagram.md` — wszystko wyciągnięte z profilu IG (bio, kontakt, statystyki).
- `dane-zrodlowe/przyklady-tresci.md` — 10 prawdziwych opisów ofert z postów (wzór tonu).
- `strona/` — pierwszy statyczny szkielet HTML (zastąpiony przez `app/`, zostawiony do wglądu; można usunąć).

## Szybki start

```bash
cd app
npm install
npm start
```

Strona: http://localhost:3000 · Panel: http://localhost:3000/admin (hasło domyślne `ania2026`).

## Co jest na stronie głównej (kolejność sekcji)

1. Hero — portret, hasło, dwa przyciski, pasek zaufania.
2. Pasek przewijany z atutami.
3. **Aktualne oferty — trzy realne nieruchomości ze zdjęciami** (zaraz pod hero, kotwica `#aktualne-oferty`).
4. Kategorie (mieszkania / domy / działki / komercja) z licznikami.
5. „Ania w liczbach” — cztery statystyki, **liczby rozmyte do czasu potwierdzenia**.
6. „Dlaczego ze mną” — sześć kart.
7. Proces sprzedaży — oś czasu; kroki 1–3 z panelu, kroki 4–6 oznaczone „do opisania”.
8. O mnie — teaser, **tekst rozmyty do czasu uzupełnienia**.
9. Opinie klientów — trzy karty, **treść rozmyta, opinie do zebrania**.
10. FAQ — sześć pytań; trzy odpowiedzi gotowe, trzy rozmyte („do ustalenia”).
11. Bezpłatna wycena — makieta formularza, **moduł do wdrożenia**.
12. Instagram — sześć kafelków (placeholdery).
13. CTA + stopka.

Konwencja oznaczeń dla klienta: pomarańczowa plakietka `w przygotowaniu` = sekcja
zaplanowana, ale bez treści; rozmyty tekst = układ gotowy, czekamy na dane.

## Oferty

Na stronie są **trzy aktywne oferty** — z prawdziwymi zdjęciami z `Downloads/oferty`:

| Oferta | Powierzchnia | Uwagi |
| --- | --- | --- |
| Lokal handlowy w CH Respan, Rzeszów, ul. Podkarpacka 53A | 166,1 m² (74,0 + 46,6 + 45,5) | numery lokali 128, 130/1, 130/2 — odczytane z rzutu kondygnacji |
| Działka budowlana 50,66 a | ok. 5 066 m² | wymiary i powierzchnia odczytane z pomiaru na zdjęciu lotniczym |
| Siedlisko 1,10 ha z domem | 11 000 m² | wymiary 173 × 160 × 64 × 52 m z opisu zdjęcia |

Dziesięć wcześniejszych ofert z postów na Instagramie zostało przestawionych na
status **„Ukryta (szkic)”** — nie były potwierdzone jako aktualne. Są w panelu,
wystarczy zmienić status, żeby wróciły na stronę.

## Braki do uzupełnienia przed publikacją

### Oferty
1. **Lokalizacje dwóch działek** — pliki `Nowy Dokument tekstowy.txt` w folderach z
   ofertami były puste, więc miejscowości nie ma skąd wziąć. Na stronie widnieje
   „Podkarpacie — dokładna lokalizacja do uzupełnienia”.
2. **Ceny wszystkich trzech ofert** — obecnie „Cena: zapytaj”.
3. **Lokal w Respanie: sprzedaż czy wynajem** — teraz oznaczony jako sprzedaż,
   z adnotacją „do potwierdzenia”. Do tego czynsz / opłaty eksploatacyjne.
4. **Dane formalne działek** — numery ewidencyjne, MPZP lub warunki zabudowy,
   media przy granicy, potwierdzenie powierzchni wypisem z rejestru gruntów.

### Strona
5. Zdjęcia — wgrane: portret Ani (hero, „Ania przy pracy”, „O mnie”), logo, favicon i og:image.
   Portret pochodzi z pliku 200 × 200 px — do publikacji warto podmienić go w panelu na zdjęcie w pionie ok. 1200 × 1600 px.
   Nadal brakuje: 6 kafelków Instagram.
6. Główny numer telefonu — obecnie `600 107 440` (nowsze posty) jako główny, `729 960 454` jako dodatkowy. Do potwierdzenia.
7. Adres e-mail — brak na IG, pole puste (na stronie widać pomarańczowy placeholder).
8. Pełne imię i nazwisko — potrzebne do stopki i klauzuli RODO.
9. Adres biura i faktyczna afiliacja — **nie wpisywać** „Pierwsze Piętro” (klient potwierdził, że Ania tam nie pracuje).
10. Tekst „O mnie” i pole „W branży od”.
11. Statystyki („Ania w liczbach”), trzy opinie klientów, trzy odpowiedzi w FAQ,
    kroki 4–6 procesu sprzedaży — wszystko oznaczone na stronie jako w przygotowaniu.
12. Własne hasło do panelu i adres docelowy strony (Ustawienia → SEO).
