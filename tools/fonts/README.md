# Font strony: Montserrat (zmienny, podzbiór łaciński)

Strona używa jednego, samodzielnie hostowanego pliku fontu:
`src/fonts/montserrat-latin-ext.var.woff2`. To zmienny Montserrat (oś `wght` 100–900),
przycięty do znaków łacińskich z polskimi literami. Obok leży licencja `src/fonts/OFL.txt`.

## Dlaczego tylko Montserrat (D-07, D-08)

- Share Tech Mono nie ma polskich liter (ą, ę, ł, ...), więc przeglądarka i tak podmieniała
  je na inny font. Inter nigdy się nie wyświetlał, bo Montserrat stał w stosie przed nim.
  Oba zostały usunięte.
- Jeden plik zmienny daje każdą grubość używaną w CSS (400, 500, 700, 800, 900) i każdą,
  której zechce faza 5, bez osobnych plików na grubość.

## Źródło (przypięte)

- Repozytorium: [google/fonts](https://github.com/google/fonts), commit
  `8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5` (najnowszy commit dotykający `ofl/montserrat`
  w dniu 2026-10-10).
- Font: <https://raw.githubusercontent.com/google/fonts/8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5/ofl/montserrat/Montserrat%5Bwght%5D.ttf>
  - 744 936 bajtów, sha256 `0f7b311b2f3279e4eef9b2f968bcdbab6e28f4daeb1f049f4f278a902bcd82f7`
- Licencja: <https://raw.githubusercontent.com/google/fonts/8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5/ofl/montserrat/OFL.txt>
  - 4 400 bajtów, sha256 `8b7141c03fa4f8d44e6345d5d4931709290f0f67875e452e95ac1fd3a027802e`
  - skopiowana bajt w bajt do `src/fonts/OFL.txt`

## Narzędzia

- Python 3.14.7
- fontTools **4.66.1** i Brotli **1.2.0** z PyPI (zweryfikowane ręcznie przed instalacją:
  github.com/fonttools/fonttools i github.com/google/brotli).
- Instalowane wyłącznie do jednorazowego wirtualnego środowiska **poza repozytorium**.
  Nie są zależnością projektu: nie ma ich w `package.json`, `package-lock.json` ani
  w żadnym pliku `requirements`.

```bash
python -m venv <katalog-poza-repo>/fontvenv
<katalog-poza-repo>/fontvenv/Scripts/python.exe -m pip install fonttools==4.66.1 brotli==1.2.0
# na Linuksie/macOS: <katalog-poza-repo>/fontvenv/bin/python
```

## Polecenia podzbioru

`python -m fontTools.subset` to ten sam program co `pyftsubset`. Oba polecenia uruchamia się
w katalogu z pobranym `Montserrat[wght].ttf`; `<repo>` to katalog główny tego repozytorium.

Font strony:

```bash
python -m fontTools.subset "Montserrat[wght].ttf" \
  --unicodes="U+0000-00FF,U+0100-017F,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212" \
  --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk' \
  --flavor=woff2 --output-file=<repo>/src/fonts/montserrat-latin-ext.var.woff2
```

Kontrolny font testowy (tylko ASCII, do kontroli negatywnej w `test/fonts.test.js`):

```bash
python -m fontTools.subset "Montserrat[wght].ttf" \
  --unicodes="U+0020-007E" \
  --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk' \
  --flavor=woff2 --output-file=<repo>/test/fixtures/montserrat-ascii.var.woff2
```

Zakresy znaków:

| Zakres | Zawartość |
|--------|-----------|
| `U+0000-00FF` | Basic Latin i Latin-1 (w tym Ó, ó) |
| `U+0100-017F` | Latin Extended-A (ą ć ę ł ń ś ź ż i wielkie litery) |
| `U+2000-206F` | interpunkcja ogólna (– „ ” … itd.) |
| `U+20AC`, `U+2122` | € i ™ |
| `U+2190-2193` | strzałki ← ↑ → ↓ |
| `U+2212` | znak minus |

Każdy znak spoza ASCII używany dziś w szablonach i skryptach (– „ ” ą ć ę ł Ł ń ó Ó ś ź ż Ż)
mieści się w tych zakresach.

Funkcje OpenType: `kern` (kerning), `liga`/`calt` (ligatury i alternatywy kontekstowe),
`ccmp`/`locl`/`mark`/`mkmk` (składanie znaków diakrytycznych i formy lokalne, ważne dla
polskich liter). Z wszystkimi funkcjami (`--layout-features='*'`) plik rośnie do ok. 64,7 KB,
więc lista jest celowo ograniczona.

## Wynik

| Plik | Rozmiar | sha256 |
|------|---------|--------|
| `src/fonts/montserrat-latin-ext.var.woff2` | 36 460 bajtów | `9a9ca6de917f4f35e431b98a88bcf5a816d24720a88a621e499dcd2800585a7c` |
| `test/fixtures/montserrat-ascii.var.woff2` | 19 884 bajtów | `e8c489faf27bdaa0edac5bf4e333bb99232f66103a07d1c201e6840f388e65aa` |

Font strony ma 354 znaki w tabeli `cmap`, oś `wght` 100–900 (tabele `fvar` i `gvar`).
Polecenie jest deterministyczne: ponowne uruchomienie daje identyczny plik (ten sam sha256).
Limit rozmiaru to 45 KB (46 080 bajtów), sprawdzany przez `test/fonts.test.js`.

## Licencja

Montserrat jest objęty licencją **SIL Open Font License 1.1** (Copyright 2024 The
Montserrat.Git Project Authors). Podzbiór to zmodyfikowana wersja fontu na tej samej licencji,
z zachowaną nazwą rodziny „Montserrat”, tak jak dystrybuuje go Google Fonts. Pełny,
niezmieniony tekst licencji leży obok fontu w `src/fonts/OFL.txt` i jest publikowany razem
z nim.

## Brak zależności w czasie działania (D-09)

Plik woff2 to zatwierdzony w repozytorium artefakt. Ani budowanie strony, ani testy nie
potrzebują Pythona, fontTools ani żadnej paczki npm z fontami: `test/fonts.test.js` czyta
tabelę `cmap` przez `lib/woff2.js` (tylko wbudowane moduły Node). Font odbudowuje się tylko
ręcznie, powtarzając powyższe kroki.
