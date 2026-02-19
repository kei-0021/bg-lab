// 深海ゲーム専用の定数
const CELL_COUNTS = {
  RA: 5,
  RB: 10,
  B_NORM: 4,
  B_TRACK: 3,
  T_VOL: 7,
  T_CRF: 6,
  N_A: 12,
  N_B: 17,
};
const ROWS = 8;
const COLS = 8;

const DEEP_SEA_RESOURCES = [
  {
    id: "OXYGEN",
    name: "酸素",
    icon: "🫧",
    currentValue: 50,
    maxValue: 50,
    type: "CONSUMABLE",
  },
  {
    id: "BATTERY",
    name: "バッテリー",
    icon: "🔋",
    currentValue: 6,
    maxValue: 6,
    type: "CONSUMABLE",
  },
];

export const deepAbyssConfig = {
  id: "deepabyss",
  dataFiles: {
    // 修正：dist/server.js から見て一つ上の public を指す
    actionCards: "../public/data/deepSeaActionCards.json",
    cells: "../public/data/deepSeaCells.json",
    speciesCards: "../public/data/deepSeaSpeciesCards.json",
  },
  setup: (
    data,
    { assertCards, createUniqueCards, createTokenStore, createBoardLayout },
  ) => {
    // データ整形
    const deepSeaSpeciesCards = assertCards(
      data.speciesCards,
      "deepSeaSpecies",
    );
    const deepSeaActionCards = createUniqueCards(
      assertCards(data.actionCards, "deepSeaAction"),
      3,
    );

    return {
      initialDecks: [
        {
          deckId: "deepSeaSpecies",
          name: "深海生物カード",
          cards: deepSeaSpeciesCards,
          backColor: "#0d3c99ff",
        },
        {
          deckId: "deepSeaAction",
          name: "アクションカード",
          cards: deepSeaActionCards,
          backColor: "#0d8999ff",
        },
      ],
      initialResources: DEEP_SEA_RESOURCES,
      initialTokenStore: createTokenStore(
        "ARTIFACT",
        "遺物",
        [{ id: "ARTIFACT", name: "💰", color: "#D4AF37" }],
        10,
      ),
      initialHand: { deckId: "deepSeaAction", count: 8 },
      initialBoard: createBoardLayout(data.cells, CELL_COUNTS, ROWS, COLS),
    };
  },
};
