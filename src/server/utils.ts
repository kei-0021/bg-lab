import * as fs from "fs/promises";
import path from "path";

export async function loadJson(relativePath: string, dirname: string): Promise<any> {
  const jsonPath = path.join(dirname, relativePath);
  const data = await fs.readFile(jsonPath, "utf-8");
  return JSON.parse(data);
}

export function assertCards(cards: any[], deckId: string): any[] {
  return cards.map((c) => {
    if (!["hand", "field", "drawn"].includes(c.drawLocation)) {
      throw new Error(`[ASSERT FAILED] deck: ${deckId}, id: ${c.id}`);
    }
    return { ...c, deckId };
  });
}

export function createUniqueCards(cards: any[], numSets: number): any[] {
  const allCards: any[] = [];
  for (let i = 1; i <= numSets; i++) {
    cards.forEach((card) =>
      allCards.push({ ...card, id: `${card.id}-set${i}` }),
    );
  }
  return allCards;
}

export function createTokenStore(id: string, name: string, templates: any[], count: number): any[] {
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

export function createBoardLayout(baseCells: any[], cellCounts: Record<string, number>, rows: number, cols: number): any[][] {
  const templateMap = baseCells.reduce((map: Record<string, any>, t) => {
    map[t.templateId] = t;
    return map;
  }, {});
  const finalCells: any[] = [];
  for (const tid in cellCounts) {
    const template = templateMap[tid];
    if (!template) continue;
    for (let i = 1; i <= cellCounts[tid]; i++) {
      finalCells.push({ ...template, id: `${tid}-${i}` });
    }
  }
  const cells2D: any[][] = [];
  for (let r = 0; r < rows; r++) {
    cells2D.push(finalCells.slice(r * cols, (r + 1) * cols));
  }
  return cells2D;
}