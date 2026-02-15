export const cardEffects = {
  緊急流量補給: ({ updateResource }) => {
    console.log(`🫧 緊急流量補給"!`);
    updateResource("OXYGEN", 10);
  },
  緊急酸素補給: ({ updateResource }) => {
    console.log(`🏥 緊急酸素補給"!`);
    updateResource("OXYGEN", 20);
  },
  探索: ({ updateResource }) => {
    console.log(`🔍 探索"!`);
    updateResource("BATTERY", -1);
  },
  "ソナー＆チャージ": ({ updateResource }) => {
    console.log(`🔋⚡️ ソナー＆チャージ"!`);
    updateResource("BATTERY", 2);
  },
};
