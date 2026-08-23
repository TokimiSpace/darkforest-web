import type { PlayerView } from "@darkforest/protocol";

export const SURVIVAL_RULES: PlayerView["survivalRules"] = {
  staminaMax: 100,
  staminaRegenEveryMs: 5_000,
  staminaRegenAmount: 5,
  rushStaminaCost: 25,
  healthyFood: { castMs: 3_000, hp: 10, stamina: 50 },
  spoiledFood: { castMs: 3_000, stamina: 25, discomfortMs: 20_000 },
};
