export const tierConfig = {
  1: { label: "Sıradan", color: "#b9aea3", dropWeight: 620, gemMin: 1, gemMax: 2 },
  2: { label: "Kaliteli", color: "#79d28b", dropWeight: 240, gemMin: 2, gemMax: 4 },
  3: { label: "Nadir", color: "#77a9ff", dropWeight: 100, gemMin: 4, gemMax: 7 },
  4: { label: "Destansı", color: "#b982ff", dropWeight: 33, gemMin: 8, gemMax: 13 },
  5: { label: "Efsanevi", color: "#f3be4f", dropWeight: 7, gemMin: 16, gemMax: 26 },
  6: { label: "Çok Efsanevi", color: "#ff4fd8", dropWeight: 1, gemMin: 32, gemMax: 48 },
  7: { label: "İlahi", color: "#6ff7ff", dropWeight: 0.12, gemMin: 64, gemMax: 96 },
  8: { label: "Kadim", color: "#9fffd4", dropWeight: 0.045, gemMin: 100, gemMax: 150 },
  9: { label: "Mistik", color: "#70f0ff", dropWeight: 0.018, gemMin: 155, gemMax: 230 },
  10: { label: "Astral", color: "#8f7dff", dropWeight: 0.007, gemMin: 240, gemMax: 340 },
  11: { label: "Kozmik", color: "#ff74f8", dropWeight: 0.0028, gemMin: 360, gemMax: 500 },
  12: { label: "Ebedi", color: "#ff8f5e", dropWeight: 0.0011, gemMin: 540, gemMax: 740 },
  13: { label: "Cehennem", color: "#ff3d3d", dropWeight: 0.00045, gemMin: 800, gemMax: 1050 },
  14: { label: "Göksel", color: "#fff06a", dropWeight: 0.00018, gemMin: 1150, gemMax: 1500 },
  15: { label: "Mutlak", color: "#ffffff", dropWeight: 0.00006, gemMin: 1700, gemMax: 2200 },
};

const tierLevelBase = { 1: 1, 2: 8, 3: 24, 4: 65, 5: 140, 6: 275, 7: 405, 8: 560, 9: 740, 10: 950, 11: 1200, 12: 1500, 13: 1850, 14: 2250, 15: 2700 };
const tierLevelStep = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 14, 6: 22, 7: 35, 8: 48, 9: 64, 10: 82, 11: 105, 12: 132, 13: 165, 14: 205, 15: 255 };
const tierPowerBase = { 1: 10, 2: 24, 3: 52, 4: 105, 5: 215, 6: 420, 7: 820, 8: 1350, 9: 2200, 10: 3500, 11: 5500, 12: 8500, 13: 13000, 14: 19800, 15: 30000 };

export function requiredLevel(tier, rank = 0) {
  return Math.max(1, tierLevelBase[tier] + Math.max(0, rank) * tierLevelStep[tier]);
}

export function tierPower(tier, rank = 0) {
  return Math.round(tierPowerBase[tier] * (1 + Math.max(0, rank) * 0.075));
}

export function tierFromGroupPosition(position, total) {
  return Math.min(15, Math.max(1, 1 + Math.floor((position * 15) / Math.max(1, total))));
}
