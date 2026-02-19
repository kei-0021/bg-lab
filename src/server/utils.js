import * as fs from "fs/promises";
import path from "path";

export async function loadJson(relativePath, dirname) {
  const jsonPath = path.join(dirname, relativePath);
  const data = await fs.readFile(jsonPath, "utf-8");
  return JSON.parse(data);
}

export function assertCards(cards, deckId) {
  return cards.map((c) => {
    if (!["hand", "field", "drawn"].includes(c.drawLocation)) {
      throw new Error(`[ASSERT FAILED] deck: ${deckId}, id: ${c.id}`);
    }
    return { ...c, deckId };
  });
}

export function createUniqueCards(cards, numSets) {
  const allCards = [];
  for (let i = 1; i <= numSets; i++) {
    cards.forEach((card) =>
      allCards.push({ ...card, id: `${card.id}-set${i}` }),
    );
  }
  return allCards;
}

export function createTokenStore(id, name, templates, count) {
  return [
    {
      tokenStoreId: id,
      name: name,
      tokens: templates.flatMap((t) =>
        Array.from({ length: count }, (_, i) => ({
          ...t,
          id: `${t.id}-${i + 1}`,
          templateId: t.id,
        })),
      ),
    },
  ];
}

export function createBoardLayout(baseCells, cellCounts, rows, cols) {
  const templateMap = baseCells.reduce((map, t) => {
    map[t.templateId] = t;
    return map;
  }, {});
  const finalCells = [];
  for (const tid in cellCounts) {
    const template = templateMap[tid];
    if (!template) continue;
    for (let i = 1; i <= cellCounts[tid]; i++) {
      finalCells.push({ ...template, id: `${tid}-${i}` });
    }
  }
  const cells2D = [];
  for (let r = 0; r < rows; r++) {
    cells2D.push(finalCells.slice(r * cols, (r + 1) * cols));
  }
  return cells2D;
}
