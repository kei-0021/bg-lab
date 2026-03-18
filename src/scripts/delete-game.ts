import fs from 'fs';
import path from 'path';

const gameName = process.argv[2];

if (!gameName) {
    console.error('削除するゲーム名を指定してください（例: npx tsx scripts/delete-game.ts Poker）');
    process.exit(1);
}

const lowerName = gameName.toLowerCase();
const pascalName = gameName.charAt(0).toUpperCase() + gameName.slice(1);

const paths = {
    config: path.join(process.cwd(), 'src/server', `${pascalName}Config.ts`),
    room: path.join(process.cwd(), 'src/rooms', `${pascalName}Room.tsx`),
    registry: path.join(process.cwd(), 'src/constants/games.ts'),
};

// ファイルの削除
[paths.config, paths.room].forEach(filePath => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted: ${path.basename(filePath)}`);
    } else {
        console.warn(`Not found: ${path.basename(filePath)}`);
    }
});

// Registry (games.ts) からの削除
if (fs.existsSync(paths.registry)) {
    const content = fs.readFileSync(paths.registry, 'utf-8');

    // 指定した id を含む行を正規表現でピンポイントに削除
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => !line.includes(`id: "${lowerName}"`));

    if (lines.length !== filteredLines.length) {
        fs.writeFileSync(paths.registry, filteredLines.join('\n'));
        console.log(`Registry entry for "${lowerName}" removed.`);
    } else {
        console.warn(`Entry for "${lowerName}" not found in registry.`);
    }
}

console.log(`Cleanup complete: ${pascalName}`);