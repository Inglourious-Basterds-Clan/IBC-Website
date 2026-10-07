# FACTS.md: teksty robocze do potwierdzenia

Ten plik to rejestr tekstów roboczych napisanych przez Claude'a, które klan musi sprawdzić i potwierdzić, zanim strona trafi do wyszukiwarek (D-05). Każdy tekst roboczy ma w źródle znacznik, a każdy znacznik ma tu swój wiersz.

## Znaczniki

- W treści szablonu: komentarz HTML `<!-- TODO(FACTS-NN): krótki opis -->` obok tekstu roboczego.
- W front matter strony: klucz `todo: "FACTS-NN"`. Nagłówek strony wypisuje go jako `<!-- TODO(FACTS-NN) -->`, dzięki czemu opis i podgląd linku na Discordzie zostają czyste.

`NN` to numer wiersza w tabeli poniżej. Komentarze Nunjucks `{# ... #}` nie są znacznikami: znikają z wyniku i bramka ich nie widzi.

## Co blokuje znacznik

- Build indeksowalny (`SITE_INDEXABLE=1`, docelowa domena) kończy się błędem, dopóki w wyniku jest jakikolwiek znacznik `TODO` (reguła G10 w `scripts/check-seo.js`).
- Podgląd na GitHub Pages (zawsze `noindex`) i `npm run dev` działają z tekstami roboczymi, więc można je obejrzeć na żywo.

## Jak potwierdzić tekst

1. Popraw albo zaakceptuj tekst w pliku źródłowym podanym w kolumnie „Gdzie”.
2. Usuń znacznik (`<!-- TODO(FACTS-NN) ... -->` albo linię `todo: "FACTS-NN"`).
3. Zmień status wiersza na `potwierdzone`.

`npm test` (test/facts.test.js) pilnuje, żeby znaczniki i ta tabela się zgadzały.

## Rejestr

| ID | Gdzie | Tekst roboczy | Status |
|----|-------|---------------|--------|
| FACTS-01 | `src/index.njk` (front matter `description`) | Polski klan Arma 3 milsim działający od 2018 roku. Regularne operacje co-op, realizm i praca zespołowa. Prowadzimy rekrutację – dołącz do nas na Discordzie! | do potwierdzenia |

Faza 4 (CONT-06) dopisuje tutaj kolejne teksty robocze w tym samym formacie.
