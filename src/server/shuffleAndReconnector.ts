import type { CellData } from "react-game-ui";

const rows = 3;
const cols = 3;

const shuffleArray = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

/**
 * グリッド状ボードレイアウトのシャッフル・再接続
 */
export const cellShuffleAndReconnector = (cells: CellData[]): CellData[] => {
    // ランダム配置
    const newCells = shuffleArray(cells);

    // セルを配置して基本データを作る
    const grid: CellData[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const template = newCells[r * cols + c];
            grid.push({
                ...template,
                id: `r${r}c${c}`,
                adjacentCellIds: [],
            });
        }
    }

    // 隣接セルIDを計算して流し込む
    grid.forEach((cell) => {
        const match = cell.id.match(/r(\d+)c(\d+)/);
        if (!match) return;
        const r = parseInt(match[1], 10);
        const c = parseInt(match[2], 10);

        const adjacents: string[] = [];
        // 上下左右の相対座標
        const directions = [
            { dr: -1, dc: 0 }, // 上
            { dr: 1, dc: 0 }, // 下
            { dr: 0, dc: -1 }, // 左
            { dr: 0, dc: 1 }, // 右
        ];

        directions.forEach(({ dr, dc }) => {
            const nr = r + dr;
            const nc = c + dc;
            // 盤面内かチェック
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                adjacents.push(`r${nr}c${nc}`);
            }
        });

        cell.adjacentCellIds = adjacents;
    });

    return grid;
};
