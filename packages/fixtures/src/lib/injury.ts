import type { PlayerView } from "@darkforest/protocol";

export function injuryRules(): PlayerView["injuryRules"] {
  return {
    legRushCostDelta: 5,
    legMoveCooldownBps: 11500,
    legSlipMultiplierBps: 15000,
    armHitPenaltyBps: -600,
  };
}
