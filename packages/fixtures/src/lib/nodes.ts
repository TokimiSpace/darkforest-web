import type { NodeId, NodeView } from "@darkforest/protocol";
import { DARKFOREST_MAP } from "./topology.ts";
import { DARKFOREST_BASE_SEARCHES, MEGACITY_BASE_SEARCHES } from "./constants.ts";

export type NodeViewOverride = Partial<Omit<NodeView, "id">>;

export function buildNodeViews(
  tagPhase: "megacity" | "darkforest",
  overrides: Partial<Record<NodeId, NodeViewOverride>> = {},
): NodeView[] {
  return DARKFOREST_MAP.nodes.map((node) => {
    const base: NodeView = {
      id: node.id,
      open: true,
      activeTags: tagPhase === "megacity" ? node.tagsMegaCity : node.tagsDarkforest,
      coverSlotsFree: node.coverSlots,
      searchesLeft: tagPhase === "megacity" ? MEGACITY_BASE_SEARCHES : DARKFOREST_BASE_SEARCHES,
      knownHazards: [],
      caches: [],
    };
    return { ...base, ...overrides[node.id] };
  });
}
