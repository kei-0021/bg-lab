import * as fs from "fs/promises";
import path from "path";
import { GameServer } from "react-game-ui/server";
import { fileURLToPath } from "url";
import { cardEffects } from "../public/data/cardEffects.js";
import { cellEffects } from "../public/data/cellEffects.js";
import { customEvents } from "../public/data/customEvents.js";

// --- パスヘルパー関数 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 外部JSONファイルを非同期で読み込み、パースするヘルパー関数
 * @param {string} relativePath - __dirname からの相対パス
 * @returns {Promise<any>} パースされたJSONオブジェクト
 */
async function loadJson(relativePath) {
  const jsonPath = path.join(__dirname, relativePath);
  try {
    const data = await fs.readFile(jsonPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading JSON file: ${relativePath}`, error);
    throw new Error(`Failed to load critical data from ${relativePath}`);
  }
}

// --- メインサーバー起動ロジック ---
async function startServer() {
  // 3つのJSONファイルを並行して非同期でロード
  const [
    deepSeaActionCardsBaseJson,
    deepSeaCellsBaseJson,
    deepSeaSpeciesDeckJson,
    fireworksCardsJson,
    fireworksThemeCardsJson,
  ] = await Promise.all([
    loadJson("../public/data/deepSeaActionCards.json"),
    loadJson("../public/data/deepSeaCells.json"),
    loadJson("../public/data/deepSeaSpeciesCards.json"),
    loadJson("../public/data/fireworksCards.json"),
    loadJson("../public/data/fireworksThemeCards.json"),
  ]);

  /**
   * JSONバリデーション
   */
  const assertCards = (cards, deckId) => {
    cards.forEach((c, i) => {
      const validLocations = ["hand", "field", "drawn"];
      if (!validLocations.includes(c.drawLocation)) {
        throw new Error(
          `[ASSERT FAILED] デッキ: ${deckId}, インデックス: ${i}, ID: ${c.id}\n` +
            `不正な drawLocation です: "${c.drawLocation}". 許容値: ${validLocations.join(", ")}`,
        );
      }
    });
    // deckId の紐付けだけはシステム実行用に適用して返す
    return cards.map((c) => ({ ...c, deckId }));
  };

  // すべてのカードセットにバリデーションを適用
  const fireworksCards = assertCards(fireworksCardsJson, "firework");
  const fireworksThemeCards = assertCards(fireworksThemeCardsJson, "theme");
  const deepSeaSpeciesCards = assertCards(
    deepSeaSpeciesDeckJson,
    "deepSeaSpecies",
  );
  const deepSeaActionCardsRaw = assertCards(
    deepSeaActionCardsBaseJson,
    "deepSeaAction",
  );

  // --- ヘルパー関数群 ---
  const createUniqueCards = (cards, numSets) => {
    const allCards = [];
    for (let i = 1; i <= numSets; i++) {
      cards.forEach((card) =>
        allCards.push({ ...card, id: `${card.id}-set${i}` }),
      );
    }
    return allCards;
  };

  const createUniqueTokens = (templates, count) =>
    templates.flatMap((t) =>
      Array.from({ length: count }, (_, i) => ({
        ...t,
        id: `${t.id}-${i + 1}`,
        templateId: t.id,
      })),
    );

  // --- DeepSea 設定 ---
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
  const ROWS = 8,
    COLS = 8;
  const deepSeaActionCardsThreeSets = createUniqueCards(
    deepSeaActionCardsRaw,
    3,
  );

  const createBoardCells = (baseCells, counts) => {
    const templateMap = baseCells.reduce((map, t) => {
      map[t.templateId] = t;
      return map;
    }, {});
    const finalCells = [];
    for (const templateId in counts) {
      const template = templateMap[templateId];
      if (!template) continue;
      for (let i = 1; i <= counts[templateId]; i++) {
        finalCells.push({ ...template, id: `${templateId}-${i}` });
      }
    }
    return finalCells;
  };

  const completeDeepSeaCells2D = (() => {
    const cells1D = createBoardCells(deepSeaCellsBaseJson, CELL_COUNTS);
    const cells2D = [];
    for (let r = 0; r < ROWS; r++) {
      cells2D.push(cells1D.slice(r * COLS, (r + 1) * COLS));
    }
    return cells2D;
  })();

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

  const DEEP_SEA_TOKENS_ARTIFACT = [
    { id: "ARTIFACT", name: "💰", color: "#D4AF37" },
  ];
  const initTokenStoresDeepSea = [
    {
      tokenStoreId: "ARTIFACT",
      name: "遺物",
      tokens: createUniqueTokens(DEEP_SEA_TOKENS_ARTIFACT, 10),
    },
  ];

  const initialDecksDeepSea = [
    {
      deckId: "deepSeaSpecies",
      name: "深海生物カード",
      cards: deepSeaSpeciesCards,
      backColor: "#0d3c99ff",
    },
    {
      deckId: "deepSeaAction",
      name: "アクションカード",
      cards: deepSeaActionCardsThreeSets,
      backColor: "#0d8999ff",
    },
  ];

  // --- Fireworks 設定 ---
  const FIREWORKS_TOKENS = [
    { id: "STAR_PART", name: "秘伝玉", color: "#FFD700" },
  ];
  const initTokenStoresFireworks = [
    {
      tokenStoreId: "STAR_PARTS",
      name: "秘伝玉",
      tokens: createUniqueTokens(FIREWORKS_TOKENS, 20),
    },
  ];

  // --- プリセットオブジェクトの定義 ---
  const gamePresets = {
    fireworks: {
      initialDecks: [
        {
          deckId: "theme",
          name: "演目カード",
          cards: fireworksThemeCards,
          backColor: "#ff0000",
        },
        {
          deckId: "firework",
          name: "花火カード",
          cards: fireworksCards,
          backColor: "#000000",
        },
      ],
      initialResources: [],
      initialTokenStore: initTokenStoresFireworks,
      initialHand: { deckId: "firework", count: 5 },
      initialBoard: [],
    },
    deepsea: {
      initialDecks: initialDecksDeepSea,
      initialResources: DEEP_SEA_RESOURCES,
      initialTokenStore: initTokenStoresDeepSea,
      initialHand: { deckId: "deepSeaAction", count: 8 },
      initialBoard: completeDeepSeaCells2D,
    },
  };

  // 渡す前のデバッグログ
  console.log("[Server] Loading presets:", Object.keys(gamePresets));

  // --- GameServer 初期化 ---
  const demoServer = new GameServer({
    port: 4000,
    clientDistPath: path.resolve(__dirname, "..", "dist"),
    libDistPath: path.resolve("../dist"),
    corsOrigins: [
      "http://localhost:5173",
      "http://localhost:4000",
      "https://bg-lab.onrender.com",
    ],
    onServerStart: (url) => {
      console.log(`🎮 Demo server running at: ${url}`);
    },
    // ★ 構築済みのオブジェクトを渡す
    gamePresets: gamePresets,
    // デフォルト設定（フォールバック用）
    initialDecks: initialDecksDeepSea,
    initialResources: DEEP_SEA_RESOURCES,
    initialTokenStore: initTokenStoresDeepSea,
    initialHand: { deckId: "deepSeaAction", count: 6 },
    initialBoard: completeDeepSeaCells2D,
    cardEffects,
    cellEffects,
    customEvents,
    initialLogCategories: {
      connection: false,
      deck: true,
      cell: false,
      custom_event: false,
    },
  });

  demoServer.start();
}

// サーバー起動関数を実行し、エラーをキャッチ
startServer().catch((err) => {
  console.error("致命的なエラー: サーバー起動に失敗しました。", err);
  // Renderでエラー終了させる
  process.exit(1);
});
