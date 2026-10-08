# IBC Website

Publiczna strona Inglourious Basterds Clan (IBC), polskiej społeczności milsim w Arma 3. Strona jest budowana przez Eleventy 3 do zwykłych plików statycznych, które można wrzucić na dowolny hosting.

## Wymagania

- **Node.js 24 LTS** (wersja jest przypięta w pliku `.nvmrc`; działa też Node >= 22.19)
- npm (instaluje się razem z Node.js)

## Szybki start

```bash
npm ci          # instalacja zależności dokładnie według package-lock.json
npm run dev     # serwer deweloperski z automatycznym odświeżaniem: http://localhost:8080/
npm run build   # czysty build produkcyjny do _site/ + kontrola SEO (scripts/check-seo.js); wymaga SITE_URL, patrz „Wdrożenie”
npm test        # testy automatyczne (budują warianty testowe do folderu _test/)
```

## Wdrożenie

> **Uwaga: folderem do wdrożenia jest teraz `_site/`, a nie katalog główny repozytorium.**
> Katalog główny zawiera już tylko źródła i konfigurację. Na serwer trafia wyłącznie zawartość `_site/`.

**Dowolny hosting statyczny:** zbuduj stronę ze zmienną `SITE_URL` ustawioną na adres, pod którym strona będzie dostępna (protokół i domena, bez ścieżki i bez ukośnika na końcu, np. `https://<domena>`). Po zakończeniu buildu wgraj na serwer zawartość folderu `_site/`.

**PowerShell:**

```powershell
$env:SITE_URL="https://<domena>"; npm run build
# po zakończeniu:
Remove-Item Env:SITE_URL
```

**Git Bash:**

```bash
SITE_URL=https://<domena> npm run build
```

Jeśli strona ma działać w podfolderze (np. `https://<domena>/<podfolder>/`), ustaw dodatkowo `PATH_PREFIX`:

**PowerShell:**

```powershell
$env:SITE_URL="https://<domena>"; $env:PATH_PREFIX="/<podfolder>/"; npm run build
# po zakończeniu:
Remove-Item Env:SITE_URL
Remove-Item Env:PATH_PREFIX
```

**Git Bash:**

```bash
MSYS_NO_PATHCONV=1 SITE_URL=https://<domena> PATH_PREFIX=/<podfolder>/ npm run build
```

Dlaczego w Git Bash potrzebne jest `MSYS_NO_PATHCONV=1`, wyjaśnia sekcja „Podgląd pod podścieżką”.

> **Bez `SITE_URL` build się nie uda, i tak ma być.** `npm run build` bez tej zmiennej celowo kończy się błędem `SITE_URL is not set…`, zamiast wpisać `http://localhost:8080` do `og:image` (obrazek w podglądzie linku na Discordzie i Facebooku). `npm run build` najpierw czyści `_site/`, a kontrola SEO usuwa z `_site/` każdy odrzucony wynik, więc po nieudanym buildzie nie ma czego wgrać na serwer.

Jeśli chcesz tylko obejrzeć wynik buildu lokalnie, bez domeny, użyj `ALLOW_LOCAL_SITE_URL=1`. Takiego buildu nigdy nie wgrywaj na serwer, bo zawiera adresy `http://localhost:8080`.

**PowerShell:**

```powershell
$env:ALLOW_LOCAL_SITE_URL="1"; npm run build
# po zakończeniu:
Remove-Item Env:ALLOW_LOCAL_SITE_URL
```

**Git Bash:**

```bash
ALLOW_LOCAL_SITE_URL=1 npm run build
```

`npm run dev` nie potrzebuje żadnej z tych zmiennych.

**Kontrola SEO w buildzie:** po Eleventy `npm run build` uruchamia `scripts/check-seo.js`. Skrypt czyta gotowy folder `_site/` i sprawdza adresy kanoniczne (canonical), obrazek podglądu (`og:image`), opisy stron (meta description), dane strukturalne JSON-LD, `sitemap.xml`, `robots.txt` i znaczniki `noindex`. Najpierw wypisuje jedną linię z rodzajem buildu:

- `check-seo: LOCAL build (...)`: build z adresem lokalnym, nigdy go nie wgrywaj,
- `check-seo: preview build (noindex on every page) for ...`: podgląd ukryty przed wyszukiwarkami (np. GitHub Pages),
- `check-seo: INDEXABLE build for ...`: build dla wyszukiwarek, tylko na docelową domenę.

Jeśli coś jest nie tak, wypisuje po jednej linii `check-seo: ...` na każdy problem, przerywa build i przenosi odrzucony wynik z `_site/` do `_site.rejected/`. Folder `_site/` wtedy nie istnieje, więc nie da się go przez pomyłkę skopiować na serwer. `_site.rejected/` służy tylko do sprawdzenia, co poszło nie tak: nigdy go nie wgrywaj (następny odrzucony build go zastępuje). Ta sama kontrola działa w GitHub Actions przy każdym pull requeście i pushu.

**GitHub Pages:** workflow `.github/workflows/pages.yml` robi wszystko sam. Sam też ustawia `SITE_URL` i `PATH_PREFIX`, więc dla GitHub Pages nie musisz niczego ustawiać. Workflow:

- przy każdym pull requeście instaluje zależności, uruchamia testy i buduje stronę, ale niczego nie publikuje,
- przy każdym pushu do `main` instaluje zależności, uruchamia testy, buduje stronę i publikuje `_site/` pod adresem https://inglourious-basterds-clan.github.io/IBC-Website/.

Strona na GitHub Pages to podgląd: każda podstrona ma `noindex`, więc nie trafia do wyników wyszukiwania (patrz „Indeksowanie w wyszukiwarkach”).

**Jednorazowe ustawienie przed pierwszym wdrożeniem:** w repozytorium na GitHubie wejdź w `Settings → Pages → Build and deployment → Source: GitHub Actions`. Dopóki to ustawienie nie jest włączone, zadanie `deploy` na `main` kończy się błędem. Po włączeniu uruchom workflow ponownie (zakładka Actions → ostatni przebieg → Re-run jobs).

## Indeksowanie w wyszukiwarkach (SITE_INDEXABLE)

Każdy build ma na każdej stronie `<meta name="robots" content="noindex">`, czyli wyszukiwarki jej nie pokazują. Wyjątkiem jest tylko build z `SITE_INDEXABLE=1` (dokładnie `1`; `true` albo `yes` nie działają). Jeśli zapomnisz tej zmiennej, strona jest ukryta, a nie wystawiona przez pomyłkę.

- Workflow GitHub Pages nigdy nie ustawia `SITE_INDEXABLE`, więc strona na GitHub Pages zawsze jest podglądem z `noindex`.
- `SITE_INDEXABLE=1` ustawiasz tylko przy buildzie na docelowy serwer IIS (patrz „Przeniesienie na docelową domenę (IIS)”).
- Taki build wymaga prawdziwego adresu `https://` w `SITE_URL` (z `localhost` albo `http://` kończy się błędem).
- Taki build wymaga `PATH_PREFIX=/` (z podfolderem kończy się błędem), bo wyszukiwarki czytają `robots.txt` tylko z katalogu głównego domeny.
- Taki build kończy się błędem, dopóki w `FACTS.md` są niepotwierdzone teksty robocze (patrz „Teksty robocze (FACTS.md)”).

**PowerShell:**

```powershell
$env:SITE_URL="https://<domena>"; $env:PATH_PREFIX="/"; $env:SITE_INDEXABLE="1"; npm run build
# po zakończeniu koniecznie:
Remove-Item Env:SITE_INDEXABLE
Remove-Item Env:SITE_URL
Remove-Item Env:PATH_PREFIX
```

> **Uwaga:** PowerShell pamięta zmienne ustawione przez `$env:` aż do zamknięcia okna. Bez `Remove-Item` każdy kolejny build w tym samym oknie też będzie indeksowalny i z tym samym adresem. Linia `check-seo: INDEXABLE build for ...` na początku kontroli SEO pokazuje, że tak się stało.

**Git Bash** (zmienne obowiązują tylko dla tego jednego polecenia):

```bash
MSYS_NO_PATHCONV=1 SITE_URL=https://<domena> PATH_PREFIX=/ SITE_INDEXABLE=1 npm run build
```

## Konfiguracja

Plik `src/_data/site.js` zawiera wartości domyślne i wspólne ustawienia strony:

- domyślny adres strony (`url`). Wartość domyślna `http://localhost:8080` działa tylko w `npm run dev` i w buildzie z `ALLOW_LOCAL_SITE_URL=1`; `npm run build` bez `SITE_URL` kończy się błędem (patrz „Wdrożenie”),
- prefiks ścieżki (`pathPrefix`), domyślnie `/`,
- nazwę klanu (`name`, `shortName`; skrót `IBC` jest dopisywany do tytułów podstron),
- listę profili społecznościowych (`social`: YouTube, Facebook), z której korzystają stopka i dane JSON-LD,
- domyślny obrazek podglądu linku (`ogImage`, `ogImageAlt`),
- kolor motywu (`themeColor`),
- link zaproszenia na Discord (`discord.invite`). Link do Discorda zmieniasz tylko tutaj; cała strona i terminal rekrutacyjny pobierają go z tego pliku.

Zmienne środowiskowe nadpisują te wartości dla jednego buildu:

- `SITE_URL`: adres strony,
- `PATH_PREFIX`: prefiks ścieżki,
- `SITE_INDEXABLE`: `1` zdejmuje `noindex` (patrz „Indeksowanie w wyszukiwarkach (SITE_INDEXABLE)”).

Workflow `.github/workflows/pages.yml` ustawia `SITE_URL` i `PATH_PREFIX` dla podglądu na GitHub Pages. Nie wpisuj domeny ani linku zaproszenia nigdzie indziej w kodzie.

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

## Przeniesienie na docelową domenę (IIS)

Docelowym serwerem jest Windows Server z IIS. GitHub Pages zostaje jako podgląd z `noindex` pod własnym adresem i workflow `.github/workflows/pages.yml` się nie zmienia: nie wpisuj tam docelowej domeny.

Lista kontrolna:

1. **Teksty robocze potwierdzone.** Wszystkie wiersze w `FACTS.md` mają status `potwierdzone`, a znaczniki `TODO(FACTS-NN)` są usunięte ze źródeł (patrz „Teksty robocze (FACTS.md)”). Inaczej build indeksowalny się nie uda.
2. **Build na docelową domenę.** Zbuduj stronę z `SITE_URL=https://<domena>`, `PATH_PREFIX=/` i `SITE_INDEXABLE=1` (polecenia w sekcji „Indeksowanie w wyszukiwarkach (SITE_INDEXABLE)”). Sprawdź, że kontrola SEO wypisała `check-seo: INDEXABLE build for https://<domena>/` i `check-seo: OK`. W PowerShell po buildzie usuń zmienne przez `Remove-Item`.
3. **Wgranie plików.** Skopiuj całą zawartość `_site/` do folderu witryny w IIS, razem z plikiem `web.config` (ustawia stronę 404 i typ MIME manifestu; GitHub Pages ten plik ignoruje).
4. **Sprawdzenie IIS.** Z innego komputera (nie z samego serwera) uruchom:

   ```bash
   curl -I https://<domena>/nie-istnieje/
   curl -I https://<domena>/site.webmanifest
   ```

   Pierwsze polecenie musi zwrócić status `404`, a ten sam adres w przeglądarce musi pokazać polską stronę `404.html` („404 // UTRACONO SYGNAŁ”). Drugie musi zwrócić `Content-Type: application/manifest+json`. Zapytania wysłane z samego serwera domyślnie dostają szczegółową stronę błędu IIS zamiast `404.html`, dlatego testuj z innej maszyny.
   Jeśli cała strona odpowiada błędem **HTTP 500.19**, to albo typ MIME jest zdefiniowany dwa razy, albo sekcja stron błędów jest zablokowana na serwerze. Odblokuj ją w IIS Manager → Feature Delegation → Error Pages → Read/Write.
5. **Google Search Console.** Dodaj domenę i zweryfikuj ją przez rekord DNS, potem w sekcji „Mapy witryn” zgłoś `https://<domena>/sitemap.xml`. Opcjonalnie sprawdź stronę główną w teście wyników z elementami rozszerzonymi (Rich Results Test), żeby zobaczyć dane JSON-LD.
6. **Podgląd linku na Discordzie.** Wklej adres strony na prywatnym kanale Discorda i sprawdź podgląd (tytuł, opis, obrazek). Jeśli Discord pokazuje stary obrazek, zmień nazwę `src/assets/og/og-default-v1.jpg` na `og-default-v2.jpg`, popraw `ogImage` w `src/_data/site.js` i zbuduj stronę ponownie (patrz „Obrazy SEO (karta OG i ikony)”).
7. **Podgląd na GitHub Pages dalej ukryty.** W źródle strony podglądu (view-source) jest `<meta name="robots" content="noindex">`, a wyszukiwanie `site:inglourious-basterds-clan.github.io` z czasem nie pokazuje żadnych stron.

> **Bez przekierowania 301.** Przekierowanie 301 ze starego adresu na nową domenę nie jest możliwe, bo GitHub Pages nie potrafi przekierować na inną domenę. Zamiast tego podgląd ma `noindex` i adres kanoniczny wskazujący na samego siebie; to przyjęte zastępstwo.

> **Przekierowania HTTP → HTTPS i z `www`** to konfiguracja serwera IIS (moduł URL Rewrite), a nie część tego repozytorium. `web.config` z buildu celowo ich nie zawiera.

## Teksty robocze (FACTS.md)

`FACTS.md` w katalogu głównym to rejestr tekstów roboczych napisanych przez Claude'a (np. opis strony głównej, teksty strony 404), które klan musi sprawdzić. Każdy taki tekst ma w źródle znacznik `TODO(FACTS-NN)` (albo `todo: "FACTS-NN"` w front matter strony), a w `FACTS.md` swój wiersz o tym samym numerze.

Jak potwierdzić tekst:

1. Popraw albo zaakceptuj tekst w pliku podanym w kolumnie „Gdzie”.
2. Usuń znacznik `TODO(FACTS-NN)` (albo linię `todo: "FACTS-NN"`).
3. Zmień status wiersza w `FACTS.md` na `potwierdzone`.

Teksty robocze blokują tylko build indeksowalny (`SITE_INDEXABLE=1`). Podgląd na GitHub Pages, zwykły `npm run build` i `npm run dev` działają z nimi normalnie, więc można je obejrzeć na żywo. `npm test` pilnuje, żeby znaczniki i tabela w `FACTS.md` się zgadzały.

## Obrazy SEO (karta OG i ikony)

Te pliki są zapisane w repozytorium i build ich nie generuje:

- `src/assets/og/og-default-v1.jpg`: karta podglądu linku 1200×630 (Discord, Facebook),
- `src/assets/icons/`: `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`,
- `src/favicon.ico`,
- `src/assets/brand/ibc-logo-512.png`: logo w danych JSON-LD.

Tworzy je jednorazowo skrypt `tools/seo-images/make-seo-images.js` z własną, osobną instalacją biblioteki sharp (`tools/seo-images/package.json`), więc `npm ci`, `npm run build` i `npm test` jej nie potrzebują. Uruchom go tylko wtedy, gdy zmienia się grafika źródłowa (`src/assets/logo.png` albo `src/assets/hero-bg.jpg`):

```bash
npm --prefix tools/seo-images ci
node tools/seo-images/make-seo-images.js
```

**Zasada wersji karty OG:** Discord i Facebook zapamiętują obrazek po adresie. Jeśli karta zmienia się po wdrożeniu, zapisz ją pod nową nazwą (`og-default-v2.jpg`, potem `-v3` itd.) i popraw `ogImage` w `src/_data/site.js`. Wtedy podglądy pobiorą nowy obrazek.

## Struktura projektu

```text
src/index.njk                    strona główna
src/404.njk                      polska strona 404 (zawsze noindex, poza mapą witryny)
src/sitemap.xml.njk              mapa witryny (sitemap.xml)
src/robots.txt.njk               robots.txt
src/site.webmanifest.njk         manifest (site.webmanifest)
src/web.config.njk               web.config dla IIS: strona 404 i typ MIME manifestu
src/_includes/layouts/base.njk   wspólny szablon wszystkich stron
src/_includes/partials/          wspólne elementy: nagłówek strony (head i SEO), nawigacja, przycisk Discorda, stopka
src/_data/site.js                adres strony, prefiks ścieżki, link do Discorda i inne wspólne ustawienia (jedno źródło)
src/_data/navigation.js          pozycje menu nawigacji
src/_dev/                        strony testowe dla deweloperów, nigdy w buildzie produkcyjnym
src/css/                         style
src/js/                          skrypty przeglądarki
src/assets/                      logo, zdjęcia, karta OG i ikony
lib/                             funkcje SEO używane podczas buildu (indeksowanie, JSON-LD, reguły kontroli SEO w lib/check-seo.js)
scripts/clean.js                 czyści _site/ przed każdym buildem
scripts/check-seo.js             kontrola SEO uruchamiana po każdym buildzie
tools/seo-images/                jednorazowy generator karty OG i ikon (osobna instalacja sharp)
FACTS.md                         rejestr tekstów roboczych do potwierdzenia
test/                            testy automatyczne (npm test)
eleventy.config.js               konfiguracja Eleventy
.github/workflows/pages.yml      build, testy i wdrożenie na GitHub Pages
```

## Strony testowe

Strony w `src/_dev/` są renderowane tylko w `npm run dev` albo gdy ustawiona jest zmienna `INCLUDE_DEV_PAGES=1` (tak robią testy). W `npm run build` nie powstają nigdy. `npm run build` zawsze najpierw usuwa folder `_site/`, więc strona testowa, która została po wcześniejszym podglądzie, nie może trafić na serwer.
