// Single source of the /jak-dolaczyc/ content: src/jak-dolaczyc.njk renders it, and
// partials/head.njk turns `faq` into the FAQPage JSON-LD, so the visible accordion and the
// structured data can never differ (D-05). Facts confirmed by the clan (D-01, D-02) carry no
// marker. A drafted entry holds its FACTS marker in a `draft` field, which the template prints as
// an HTML comment next to the text; confirming it = deleting the `draft` line (FACTS.md).
export default {
  requirements: [
    "Zalecane 16+. Nie pilnujemy tego sztywno: dojrzałość liczy się bardziej niż wiek, a na misji trzeba umieć słuchać rozkazów dowódcy.",
    "Legalna kopia Arma 3. Żadne CDLC nie jest wymagane.",
    "Działający mikrofon i TeamSpeak. W grze używamy ACRE2 (na części wspólnych operacji TFAR).",
    "Standardowy modpack, ok. 90 GB, pobierany ze Steam Workshop według presetu udostępnionego na Discordzie.",
    "Rekrutujemy polskich graczy.",
    "Chęć nauki i szacunek dla innych członków społeczności.",
  ],
  steps: [
    {
      title: "Wejdź na Discord i wybierz rolę Kadet",
      text: "Dołącz do naszego serwera Discord i nadaj sobie rolę Kadet. Od tej chwili widzisz kanał kadetów.",
    },
    {
      title: "Odezwij się do rekrutera",
      text: "W ciągu 3 dni odezwij się do rekrutera na kanale kadetów. Umówicie się na rozmowę w dogodnym terminie.",
    },
    {
      title: "Zainstaluj modpack",
      text: "Pobierz standardowy modpack (ok. 90 GB) ze Steam Workshop według presetu z Discorda. Bez niego nie przejdziesz szkolenia.",
    },
    {
      title: "Rozmowa rekrutacyjna",
      text: "Krótka rozmowa, zwykle 15–20 minut, o zasadach klanu i o tym, jak u nas wygląda gra.",
    },
    {
      title: "Szkolenie podstawowe",
      text: "Zaraz po rozmowie przechodzisz szkolenie podstawowe. Komuś, kto dopiero kupił Arma 3, zajmuje ono 2–3,5 godziny.",
    },
    {
      title: "Awans na Klanowicza",
      text: "Po szkoleniu podstawowym automatycznie zostajesz Klanowiczem. Możesz brać udział w grach i zdobywać specjalizacje.",
    },
  ],
};
