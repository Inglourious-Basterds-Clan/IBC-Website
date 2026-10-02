# IBC Website

Publiczna strona Inglourious Basterds Clan (IBC), polskiej społeczności milsim w Arma 3. Strona jest budowana przez Eleventy 3 do zwykłych plików statycznych, które można wrzucić na dowolny hosting.

## Wymagania

- **Node.js 24 LTS** (wersja jest przypięta w pliku `.nvmrc`; działa też Node >= 22.19)
- npm (instaluje się razem z Node.js)

## Szybki start

```bash
npm ci          # instalacja zależności dokładnie według package-lock.json
npm run dev     # serwer deweloperski z automatycznym odświeżaniem: http://localhost:8080/
npm run build   # czysty build produkcyjny do folderu _site/
npm test        # testy automatyczne (budują warianty testowe do folderu _test/)
```

## Wdrożenie

> **Uwaga: folderem do wdrożenia jest teraz `_site/`, a nie katalog główny repozytorium.**
> Katalog główny zawiera już tylko źródła i konfigurację. Na serwer trafia wyłącznie zawartość `_site/`.

**Dowolny hosting statyczny:** uruchom `npm run build` i wgraj zawartość folderu `_site/`.

**GitHub Pages:** workflow `.github/workflows/pages.yml` robi wszystko sam:

- przy każdym pull requeście instaluje zależności, uruchamia testy i buduje stronę, ale niczego nie publikuje,
- przy każdym pushu do `main` instaluje zależności, uruchamia testy, buduje stronę i publikuje `_site/` pod adresem https://inglourious-basterds-clan.github.io/IBC-Website/.

**Jednorazowe ustawienie przed pierwszym wdrożeniem:** w repozytorium na GitHubie wejdź w `Settings → Pages → Build and deployment → Source: GitHub Actions`. Dopóki to ustawienie nie jest włączone, zadanie `deploy` na `main` kończy się błędem. Po włączeniu uruchom workflow ponownie (zakładka Actions → ostatni przebieg → Re-run jobs).

## Konfiguracja

Jedynym miejscem konfiguracji jest plik `src/_data/site.js`. Znajdują się w nim:

- adres strony (`SITE_URL`), domyślnie `http://localhost:8080`,
- prefiks ścieżki (`PATH_PREFIX`), domyślnie `/`,
- link zaproszenia na Discord (`discord.invite`). Link do Discorda zmieniasz tylko tutaj; cała strona i terminal rekrutacyjny pobierają go z tego pliku.

Zmienne środowiskowe `SITE_URL` i `PATH_PREFIX` nadpisują wartości domyślne. GitHub Actions ustawia je w `.github/workflows/pages.yml`. Nie wpisuj domeny ani linku zaproszenia nigdzie indziej w kodzie.

### Podgląd pod podścieżką (jak na GitHub Pages)

Na GitHub Pages strona działa pod `/IBC-Website/`. Żeby sprawdzić to lokalnie:

**PowerShell:**

```powershell
$env:PATH_PREFIX="/IBC-Website/"; npm run dev
# otwórz http://localhost:8080/IBC-Website/
# po zakończeniu:
Remove-Item Env:PATH_PREFIX
```

**Git Bash:**

```bash
MSYS_NO_PATHCONV=1 PATH_PREFIX=/IBC-Website/ npm run dev
# otwórz http://localhost:8080/IBC-Website/
```

Bez `MSYS_NO_PATHCONV=1` Git Bash zamienia `/IBC-Website/` na ścieżkę Windows (np. `C:/Program Files/Git/IBC-Website/`) i wszystkie linki na stronie przestają działać.

## Zmiana domeny

Po zakupie domeny:

1. W `.github/workflows/pages.yml` ustaw `SITE_URL` na `https://<domena>` i `PATH_PREFIX` na `/`.
2. Podepnij domenę w ustawieniach repozytorium: `Settings → Pages → Custom domain`.
3. Zrób push do `main`.

Nic więcej w kodzie nie trzeba zmieniać.

## Struktura projektu

```text
src/index.njk                    strona główna
src/_includes/layouts/base.njk   wspólny szablon wszystkich stron
src/_includes/partials/          wspólne elementy: nagłówek, nawigacja, przycisk Discorda, stopka
src/_data/site.js                adres strony, prefiks ścieżki i link do Discorda (jedno źródło)
src/_data/navigation.js          pozycje menu nawigacji
src/_dev/                        strony testowe dla deweloperów, nigdy w buildzie produkcyjnym
src/css/                         style
src/js/                          skrypty przeglądarki
src/assets/                      logo i zdjęcia
scripts/clean.js                 czyści _site/ przed każdym buildem
test/                            testy automatyczne (npm test)
eleventy.config.js               konfiguracja Eleventy
.github/workflows/pages.yml      build, testy i wdrożenie na GitHub Pages
```

## Strony testowe

Strony w `src/_dev/` są renderowane tylko w `npm run dev` albo gdy ustawiona jest zmienna `INCLUDE_DEV_PAGES=1` (tak robią testy). W `npm run build` nie powstają nigdy. `npm run build` zawsze najpierw usuwa folder `_site/`, więc strona testowa, która została po wcześniejszym podglądzie, nie może trafić na serwer.
