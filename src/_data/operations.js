// Single source of the /operacje/ content (D-13): src/operacje.njk renders it. Facts confirmed
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
};
