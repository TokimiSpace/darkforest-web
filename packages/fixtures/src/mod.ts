export type { Fixture } from "./types.ts";

export { openingMegaCity } from "./scenarios/opening_mega_city.ts";
export { combatSkirmish } from "./scenarios/combat_skirmish.ts";
export { downedRescue } from "./scenarios/downed_rescue.ts";
export { echoMode } from "./scenarios/echo_mode.ts";
export { legacyPrompt } from "./scenarios/legacy_prompt.ts";
export { darkforestHazard } from "./scenarios/darkforest_hazard.ts";
export { finalReckoning } from "./scenarios/final_reckoning.ts";
export { replaySample } from "./scenarios/replay_sample.ts";
export { shopVisit } from "./scenarios/shop_visit.ts";
export { finalCovenant } from "./scenarios/final_covenant.ts";
export { finalAllDead } from "./scenarios/final_all_dead.ts";
export { rejectionDrill } from "./scenarios/rejection_drill.ts";

import type { Fixture } from "./types.ts";
import { openingMegaCity } from "./scenarios/opening_mega_city.ts";
import { combatSkirmish } from "./scenarios/combat_skirmish.ts";
import { downedRescue } from "./scenarios/downed_rescue.ts";
import { echoMode } from "./scenarios/echo_mode.ts";
import { legacyPrompt } from "./scenarios/legacy_prompt.ts";
import { darkforestHazard } from "./scenarios/darkforest_hazard.ts";
import { finalReckoning } from "./scenarios/final_reckoning.ts";
import { replaySample } from "./scenarios/replay_sample.ts";
import { shopVisit } from "./scenarios/shop_visit.ts";
import { finalCovenant } from "./scenarios/final_covenant.ts";
import { finalAllDead } from "./scenarios/final_all_dead.ts";
import { rejectionDrill } from "./scenarios/rejection_drill.ts";

export const fixtures: Fixture[] = [
  openingMegaCity,
  combatSkirmish,
  downedRescue,
  echoMode,
  legacyPrompt,
  darkforestHazard,
  finalReckoning,
  replaySample,
  shopVisit,
  finalCovenant,
  finalAllDead,
  rejectionDrill,
];

export const fixturesByName: ReadonlyMap<string, Fixture> = new Map(
  fixtures.map((f) => [f.name, f]),
);
