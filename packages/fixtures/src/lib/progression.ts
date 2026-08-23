import type { PlayerView } from "@darkforest/protocol";

export function progressionRules(maxHp = 100): PlayerView["progressionRules"] {
  return {
    levelCap: 5,
    levelThresholds: [20, 45, 75, 110],
    maxHpPerLevel: 5,
    maxHp,
  };
}
