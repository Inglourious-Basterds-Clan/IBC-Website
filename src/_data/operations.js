// Single source of the /operacje/ content (D-13): src/operacje.njk renders it and lib/images.js
// processes each recap `file` (thumbnails, as for the gallery). Facts confirmed
// by the clan (D-02) carry no marker. A drafted entry holds its FACTS marker in a `draft` field,
// which the template prints as an HTML comment next to the text; confirming it = deleting the
// `draft` line (FACTS.md). The `upcoming` block is the slot for a calendar fed by the clan's
// Discord bot (ENG-04, v2); until then it only points to Discord and lists no dates (D-10).
export default {
  schedule: [
    {
      label: "Misje",
      text: "Gramy głównie w weekendy. Misje startują o 19:00 i trwają zwykle 2–3 godziny.",
    },
    {
      label: "Gry Zeusowe",
      text: "Poza zaplanowanymi misjami organizujemy luźniejsze gry Zeusowe. Ogłaszamy je na Discordzie tego samego dnia.",
    },
  ],
  // The names are exact: every recap `type` must equal one of them.
  missionTypes: [
    {
      name: "PvE",
      text: "Większość naszych misji. Gramy przeciwko przeciwnikowi sterowanemu przez AI, a scenariusze przygotowują nasi Mission Makerzy.",
    },
    {
      name: "Joint Operations",
      text: "Co jakiś czas gramy wspólne operacje (JO/JOP) z innymi polskimi i zagranicznymi klanami. Na części z nich używamy TFAR zamiast ACRE2.",
    },
    {
      name: "Gra Zeusowa",
      text: "Prowadzący (Zeus) buduje scenariusz na bieżąco w trakcie gry: dokłada przeciwników, zmienia zadania i reaguje na to, co robi oddział. Takie gry są luźniejsze i zawsze osadzone we współczesności.",
    },
  ],
  eras: [
    "Współczesność",
    "Wietnam",
    "Zimna wojna",
    "II wojna światowa (czasem)",
    "Nietypowe scenariusze: Warhammer 40k, post-apo",
  ],
  erasNote: "Gry Zeusowe są zawsze współczesne. Misje obejmują to, co przygotuje Mission Maker, a niektóre z nich mają własny, dopasowany modpack.",
  evening: {
    draft: "TODO(FACTS-07)",
    steps: [
      {
        time: "18:45",
        name: "Sloty",
        text: "Zbieramy się na TeamSpeaku i zapisujemy na role w oddziale.",
      },
      {
        time: "19:00",
        name: "Odprawa (briefing)",
        text: "Dowódca omawia zadanie, teren i plan działania. Każdy wie, co robi jego sekcja.",
      },
      {
        time: "19:15",
        name: "Misja",
        text: "Właściwa gra: zwykle 2–3 godziny pracy zespołowej pod dowództwem.",
      },
      {
        time: "ok. 21:30",
        name: "Debriefing (feedback dla Mission Makera)",
        text: "Krótko omawiamy przebieg misji: co zadziałało, co poprawić i jak oceniamy scenariusz Mission Makera.",
      },
      {
        time: "ok. 21:45",
        name: "Przegląd OCAP",
        draft: "TODO(FACTS-08)",
        text: "OCAP to zapis przebiegu całej misji na mapie. Oglądamy go razem po grze i widzimy, jak poruszały się wszystkie oddziały.",
      },
    ],
  },
  upcoming: {
    title: "Najbliższe misje",
    text: "Misje i gry Zeusowe ogłaszamy na Discordzie. Gry Zeusowe pojawiają się tego samego dnia, więc zajrzyj tam przed wieczorem.",
  },
  // Entered by hand whenever the recaps change; never the build date.
  lastUpdate: { date: "2026-10-11", draft: "TODO(FACTS-09)" },
  // Recap cards (D-12). The page sorts them newest first by `date` (ISO "YYYY-MM-DD"), so the
  // order here does not matter. `file` is a committed original in src/images/ (lib/images.js
  // makes the thumbnails), `type` must equal one of the missionTypes names, `setting` reads
  // "era · map". No member names or callsigns in the texts.
  recaps: [
    {
      draft: "TODO(FACTS-10)",
      file: "jo_1967.png",
      date: "2026-09-20",
      title: "Operacja Crimson Dawn",
      setting: "Wietnam 1967 · Khe Sanh",
      type: "Joint Operations",
      text: "Wspólna operacja z innymi klanami w realiach wojny w Wietnamie. Pluton szturmował umocnione pozycje przeciwnika przy wsparciu lotnictwa (CAS), a najwięcej pracy wymagała koordynacja z pilotami.",
      alt: "Pluton atakuje umocnione pozycje przeciwnika podczas wspólnej operacji w realiach Wietnamu 1967",
    },
    {
      draft: "TODO(FACTS-13)",
      file: "op_patrol.jpg",
      date: "2026-10-10",
      title: "Wieczór z Zeusem: zasadzka na drodze",
      setting: "Współczesność · Czarnoruś",
      type: "Gra Zeusowa",
      text: "Gra ogłoszona na Discordzie tego samego popołudnia. Zeus na bieżąco dokładał przeciwników, a oddział zabezpieczał leśną drogę i odpierał kolejne ataki.",
      alt: "Oddział w kamuflażu zabezpiecza leśną drogę podczas gry Zeusowej",
    },
  ],
};
