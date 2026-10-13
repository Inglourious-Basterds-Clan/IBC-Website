# FACTS.md: teksty robocze do potwierdzenia

Ten plik to rejestr tekstów roboczych napisanych przez Claude'a, które klan musi sprawdzić i potwierdzić, zanim strona trafi do wyszukiwarek (D-05). Każdy tekst roboczy ma w źródle znacznik, a każdy znacznik ma tu swój wiersz.

## Znaczniki

- W treści szablonu: komentarz HTML `<!-- TODO(FACTS-NN): krótki opis -->` obok tekstu roboczego.
- W front matter strony: klucz `todo: "FACTS-NN"`. Jeśli strona ma kilka tekstów roboczych, podaj listę: `todo: ["FACTS-01", "FACTS-02"]`. Nagłówek strony wypisuje osobny komentarz `<!-- TODO(FACTS-NN) -->` dla każdego numeru, dzięki czemu opis i podgląd linku na Discordzie zostają czyste.
- W pliku danych w `src/_data/` (np. `src/_data/join.js`): pole wpisu `draft: "TODO(FACTS-NN)"`. Szablon wypisuje je jako komentarz HTML obok tekstu, a sam znacznik nigdy nie trafia do treści pytania, odpowiedzi ani do JSON-LD. Potwierdzenie = usunięcie linii `draft`.

`NN` to numer wiersza w tabeli poniżej. Komentarze Nunjucks `{# ... #}` nie są znacznikami: znikają z wyniku i bramka ich nie widzi.

## Co blokuje znacznik

- Build indeksowalny (`SITE_INDEXABLE=1`, docelowa domena) kończy się błędem, dopóki w wyniku jest jakikolwiek znacznik `TODO` (reguła G10 w `lib/check-seo.js`, uruchamiana po buildzie przez `scripts/check-seo.js`).
- Podgląd na GitHub Pages (zawsze `noindex`) i `npm run dev` działają z tekstami roboczymi, więc można je obejrzeć na żywo.

## Jak potwierdzić tekst

1. Popraw albo zaakceptuj tekst w pliku źródłowym podanym w kolumnie „Gdzie”.
2. Usuń znacznik (`<!-- TODO(FACTS-NN) ... -->`, linię `todo: "FACTS-NN"` albo linię `draft: "TODO(FACTS-NN)"`).
3. Zmień status wiersza na `potwierdzone`.

`npm test` (test/facts.test.js) pilnuje, żeby znaczniki i ta tabela się zgadzały.

## Rejestr

| ID | Gdzie | Tekst roboczy | Status |
|----|-------|---------------|--------|
| FACTS-01 | `src/index.njk` (front matter `description`) | Polski klan Arma 3 milsim działający od 2018 roku. Regularne operacje co-op, realizm i praca zespołowa. Prowadzimy rekrutację – dołącz do nas na Discordzie! | do potwierdzenia |
| FACTS-02 | `src/404.njk` (nagłówek h1, linia statusu, akapit i etykiety przycisków) | 404 // UTRACONO SYGNAŁ / Status // Brak sygnału z tego sektora / Ta strona nie istnieje. Sprawdź adres albo wróć do bazy. / Wróć na stronę główną / Dołącz na Discordzie | do potwierdzenia |
| FACTS-03 | `src/jak-dolaczyc.njk` (front matter `description`, linia statusu, akapit wstępu) | Jak dołączyć do IBC, polskiego klanu Arma 3 milsim: wymagania, rekrutacja krok po kroku i odpowiedzi na najczęstsze pytania. Rekrutacja przez Discord. / Status // Rekrutacja otwarta / Gramy zespołowo i na luzie, ale z dyscypliną na misji. Poniżej znajdziesz wymagania, rekrutację krok po kroku i odpowiedzi na najczęstsze pytania. Całą rekrutację prowadzimy na Discordzie. | do potwierdzenia |
| FACTS-04 | `src/_data/join.js` (FAQ `doswiadczenie`) | Nie. Szkolenie podstawowe jest przygotowane z myślą o nowych graczach, także o tych, którzy dopiero kupili Arma 3. Wszystkiego, czego potrzebujesz na start, nauczysz się u nas. | do potwierdzenia |
| FACTS-05 | `src/_data/join.js` (FAQ `obecnosc`) | Nie. Nie wymagamy obecności na każdej misji, ale liczymy na to, że będziesz grać z nami regularnie. Jeśli nie możesz przyjść na misję, na którą się zapisałeś, daj znać na Discordzie. | do potwierdzenia |
| FACTS-06 | `src/operacje.njk` (front matter `description`, linia statusu, akapit wstępu) | Operacje IBC, polskiego klanu Arma 3 milsim: harmonogram, rodzaje misji, epoki, przebieg typowego wieczoru i relacje z ostatnich operacji. / Status // Harmonogram i raporty z operacji / Gramy głównie w weekendy wieczorem. Poniżej znajdziesz harmonogram, rodzaje misji, epoki, przebieg typowego wieczoru i relacje z ostatnich operacji. | do potwierdzenia |
| FACTS-07 | `src/_data/operations.js` (`evening`: godziny typowego wieczoru) | 18:45 Sloty / 19:00 Odprawa (briefing) / 19:15 Misja / ok. 21:30 Debriefing (feedback dla Mission Makera) / ok. 21:45 Przegląd OCAP | do potwierdzenia |
| FACTS-08 | `src/_data/operations.js` (`evening`, krok „Przegląd OCAP”: wyjaśnienie OCAP) | OCAP to zapis przebiegu całej misji na mapie. Oglądamy go razem po grze i widzimy, jak poruszały się wszystkie oddziały. | do potwierdzenia |
| FACTS-09 | `src/_data/operations.js` (`lastUpdate`: data „Ostatnia aktualizacja” relacji) | 2026-10-11 (11 października 2026). Wpisywana ręcznie przy każdej zmianie relacji, nigdy data buildu. | do potwierdzenia |
| FACTS-10 | `src/_data/operations.js` (relacja `jo_1967.png`) | Operacja Crimson Dawn · 2026-09-20 · Wietnam 1967 · Khe Sanh · Joint Operations · Wspólna operacja z innymi klanami w realiach wojny w Wietnamie. Pluton szturmował umocnione pozycje przeciwnika przy wsparciu lotnictwa (CAS), a najwięcej pracy wymagała koordynacja z pilotami. | do potwierdzenia |
| FACTS-13 | `src/_data/operations.js` (relacja `op_patrol.jpg`) | Wieczór z Zeusem: zasadzka na drodze · 2026-10-10 · Współczesność · Czarnoruś · Gra Zeusowa · Gra ogłoszona na Discordzie tego samego popołudnia. Zeus na bieżąco dokładał przeciwników, a oddział zabezpieczał leśną drogę i odpierał kolejne ataki. | do potwierdzenia |

Kolejne teksty robocze dopisujemy tutaj w tym samym formacie.
