import * as fs from 'fs/promises';
import path from "path";
import { GameServer } from "react-game-ui/server"; // サーバー専用
import { fileURLToPath } from 'url';
import { cardEffects } from "../public/data/cardEffects.js"; // サーバー専用
import { cellEffects } from "../public/data/cellEffects.js"; // サーバー専用

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
    const data = await fs.readFile(jsonPath, 'utf-8');
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
    deepSeaSpeciesDeckJson
  ] = await Promise.all([
    loadJson("../public/data/deepSeaActionCards.json"),
    loadJson("../public/data/deepSeaCells.json"),
    loadJson("../public/data/deepSeaSpeciesCards.json")
  ]);

  // --- セル・カード・トークンの生成ロジック（そのまま使用） ---
  const CELL_COUNTS = { RA:5,RB:10,B_NORM:4,B_TRACK:3,T_VOL:7,T_CRF:6,N_A:12,N_B:17 };
  const ROWS = 8, COLS = 8;

  const createUniqueCards = (cards, numSets) => {
    const allCards = [];
    for (let i = 1; i <= numSets; i++) {
      cards.forEach(card => allCards.push({...card,id:`${card.id}-set${i}`}));
    }
    return allCards;
  };

  const deepSeaActionCardsThreeSets = createUniqueCards(deepSeaActionCardsBaseJson, 3);

  const createBoardCells = (baseCells, counts) => {
    const templateMap = baseCells.reduce((map,t)=>{map[t.templateId]=t;return map;},{});
    const finalCells=[];
    for (const templateId in counts) {
      const template = templateMap[templateId];
      for (let i=1;i<=counts[templateId];i++){
        finalCells.push({...template,id:`${templateId}-${i}`});
      }
    }
    return finalCells;
  };

  const completeDeepSeaCells2D = (() => {
    const cells1D = createBoardCells(deepSeaCellsBaseJson, CELL_COUNTS);
    const cells2D=[];
    for(let r=0;r<ROWS;r++){
      cells2D.push(cells1D.slice(r*COLS,(r+1)*COLS));
    }
    return cells2D;
  })();

  const DEEP_SEA_RESOURCES = [
    { id:'OXYGEN', name:'酸素', icon:'🫧', currentValue:50, maxValue:50, type:'CONSUMABLE'},
    { id:'BATTERY', name:'バッテリー', icon:'🔋', currentValue:6, maxValue:6, type:'CONSUMABLE'}
  ];

  const DEEP_SEA_TOKENS_ARTIFACT=[{id:'ARTIFACT',name:'💰',color:'#D4AF37'}];

  const createUniqueTokens=(templates,count)=>templates.flatMap(t=>Array.from({length:count},(_,i)=>({...t,id:`${t.id}-${i+1}`,templateId:t.id})));

  const initTokenStores=[{tokenStoreId:"ARTIFACT",name:"遺物",tokens:createUniqueTokens(DEEP_SEA_TOKENS_ARTIFACT,10)}];

  const initialDecks=[
    {deckId:"deepSeaSpecies",name:"深海生物カード",cards:deepSeaSpeciesDeckJson,backColor:"#0d3c99ff"},
    {deckId:"deepSeaAction",name:"アクションカード",cards:deepSeaActionCardsThreeSets,backColor:"#0d8999ff"}
  ];

  // --- GameServer 初期化 ---
  const demoServer = new GameServer({
    port:4000,
    clientDistPath: path.resolve(__dirname, '..', 'dist'), 
    libDistPath:path.resolve("../dist"),
    corsOrigins: [
      "http://localhost:5173",
      "http://localhost:4000",
      "https://full-moon-night.onrender.com" // ← これを追加！
    ],
    onServerStart: (url) => {
      console.log(`🎮 Demo server running at: ${url}`);
    },
    initialDecks,
    cardEffects,
    initialResources:DEEP_SEA_RESOURCES,
    initialTokenStore:initTokenStores,
    initialHand:{deckId:"deepSeaAction",count:6},
    initialBoard:completeDeepSeaCells2D,
    cellEffects, // cellEffects が未定義のため、一旦コメントアウトまたは定義を追加してください
    initialLogCategories:{connection:false,deck:true,cell:false}
  });

  demoServer.start();
}

// サーバー起動関数を実行し、エラーをキャッチ
startServer().catch(err => {
    console.error("致命的なエラー: サーバー起動に失敗しました。", err);
    // Renderでエラー終了させる
    process.exit(1);
});
