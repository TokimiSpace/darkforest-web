import type { PlayerView } from "@darkforest/protocol";

export function professionRules(): PlayerView["professionRules"] {
  return { courierRushCostDelta: -3 };
}
