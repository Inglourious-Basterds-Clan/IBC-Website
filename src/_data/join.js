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
  // Plain text only (no HTML, no links): the same strings become the FAQPage JSON-LD (D-05).
  // An id is the anchor a recruiter can link to (/jak-dolaczyc/#mody): unique ASCII kebab-case,
  // different from the page block ids (wymagania, kroki, faq). The link only scrolls to the
  // question (pages.css scroll-margin-top clears the fixed header); the accordion stays
  // closed, because the id sits on the <details> itself and D-04 keeps the FAQ free of JS.
  faq: [
    {
      id: "wiek",
      question: "Ile trzeba mieć lat, żeby dołączyć?",
      answer: "Zalecane 16+. Nie pilnujemy tego sztywno, bo dojrzałość liczy się u nas bardziej niż wiek.",
    },
    {
      id: "doswiadczenie",
      draft: "TODO(FACTS-04)",
      question: "Czy muszę mieć doświadczenie w Arma 3?",
      answer: "Nie. Szkolenie podstawowe jest przygotowane z myślą o nowych graczach, także o tych, którzy dopiero kupili Arma 3. Wszystkiego, czego potrzebujesz na start, nauczysz się u nas.",
    },
    {
      id: "rekrutacja",
      question: "Jak wygląda rekrutacja?",
      answer: "Wchodzisz na Discord, wybierasz rolę Kadet i w ciągu 3 dni odzywasz się do rekrutera na kanale kadetów. Potem instalujesz modpack, przechodzisz krótką rozmowę i szkolenie podstawowe, po którym zostajesz Klanowiczem.",
    },
    {
      id: "szkolenie",
      question: "Ile trwa rozmowa i szkolenie podstawowe?",
      answer: "Rozmowa rekrutacyjna trwa zwykle 15–20 minut. Szkolenie podstawowe odbywa się zaraz po niej i komuś, kto dopiero kupił Arma 3, zajmuje 2–3,5 godziny.",
    },
    {
      id: "kiedy-gracie",
      question: "Kiedy gracie i ile trwa misja?",
      answer: "Misje gramy głównie w weekendy o 19:00 i trwają one około 2–3 godzin. Gry Zeusowe ogłaszamy tego samego dnia.",
    },
    {
      id: "obecnosc",
      draft: "TODO(FACTS-05)",
      question: "Czy muszę być na każdej misji?",
      answer: "Nie. Nie wymagamy obecności na każdej misji, ale liczymy na to, że będziesz grać z nami regularnie. Jeśli nie możesz przyjść na misję, na którą się zapisałeś, daj znać na Discordzie.",
    },
    {
      id: "styl-gry",
      question: "Jaki styl gry macie: milsim czy luźna gra?",
      answer: "Gramy luźny milsim bez RP. Atmosfera jest swobodna, ale na misji potrzebna jest dojrzałość, żeby słuchać rozkazów dowódcy.",
    },
    {
      id: "mody",
      question: "Ile miejsca zajmują mody i skąd je pobrać?",
      answer: "Standardowy modpack zajmuje ok. 90 GB (około 55 modów). Pobierasz go ze Steam Workshop według presetu udostępnionego na Discordzie. Jest wymagany na szkolenie podstawowe.",
    },
    {
      id: "modpack-misji",
      question: "Czy każda misja ma ten sam modpack?",
      answer: "Standardowy modpack służy do gier Zeusowych i do tworzenia misji. Niektóre misje mają jednak własny, dopasowany modpack.",
    },
    {
      id: "dlc",
      question: "Czy potrzebuję DLC?",
      answer: "Nie, żadne CDLC nie jest wymagane. Przydają się na misjach w Wietnamie, ale dzięki compat data zagrasz bez nich, tylko z reklamami DLC w grze.",
    },
    {
      id: "radio",
      question: "Czego potrzebuję do komunikacji?",
      answer: "Działającego mikrofonu i TeamSpeaka. W grze używamy ACRE2, a na części wspólnych operacji TFAR.",
    },
    {
      id: "zeus",
      question: "Czym są gry Zeusowe?",
      answer: "To gry, w których mistrz gry (Zeus) buduje scenariusz na bieżąco. Są luźniejsze, toczą się tylko we współczesnych realiach i ogłaszamy je tego samego dnia.",
    },
    {
      id: "jo",
      question: "Czym są Joint Operations (JO/JOP)?",
      answer: "To wspólne operacje z innymi klanami, polskimi i zagranicznymi. Gramy je od czasu do czasu, obok naszych zwykłych misji PvE.",
    },
    {
      id: "epoki",
      question: "W jakich epokach i scenariuszach gracie?",
      answer: "W tym, co przygotuje Mission Maker: współczesność, Wietnam, zimna wojna, czasem II wojna światowa, a do tego nietypowe klimaty, takie jak Warhammer 40k czy post-apo.",
    },
    {
      id: "po-szkoleniu",
      question: "Co dalej po szkoleniu podstawowym?",
      answer: "Po szkoleniu automatycznie zostajesz Klanowiczem. Możesz wtedy brać udział w grach i zdobywać specjalizacje.",
    },
  ],
};
