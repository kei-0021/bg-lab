export const cardEffects: Record<string, (params: any) => void> = {
  緊急流量補給: ({ updateResource }: any) => {
    console.log(`🫧 緊急流量補給"!`);
    updateResource("OXYGEN", 10);
  },
  緊急酸素補給: ({ updateResource }: any) => {
    console.log(`🏥 緊急酸素補給"!`);
    updateResource("OXYGEN", 20);
  },
  探索: ({ updateResource }: any) => {
    console.log(`🔍 探索"!`);
    updateResource("BATTERY", -1);
  },
  "ソナー＆チャージ": ({ updateResource }: any) => {
    console.log(`🔋⚡️ ソナー＆チャージ"!`);
    updateResource("BATTERY", 2);
  },
};
