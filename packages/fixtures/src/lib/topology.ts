import type { MapTopology } from "@darkforest/protocol";
import { gm } from "./time.ts";

export const DARKFOREST_MAP: MapTopology = {
  nodes: [
    {
      id: "N1",
      nameMegaCity: "Red Root",
      nameDarkforest: "Arbora Rootheart",
      tagsMegaCity: ["POWERED", "CRAMPED"],
      tagsDarkforest: ["DENSE", "CRAMPED"],
      coverSlots: 2,
    },
    {
      id: "N2",
      nameMegaCity: "Maintenance Ring",
      nameDarkforest: "Field Workshop",
      tagsMegaCity: ["CRAMPED", "DEBRIS"],
      tagsDarkforest: ["CRAMPED", "DEBRIS"],
      coverSlots: 3,
    },
    {
      id: "N3",
      nameMegaCity: "Waterworks",
      nameDarkforest: "Blackwater Marsh",
      tagsMegaCity: ["WET", "MUD"],
      tagsDarkforest: ["WET", "MUD"],
      coverSlots: 1,
    },
    {
      id: "N4",
      nameMegaCity: "Luxury Atrium",
      nameDarkforest: "Flooded Atrium",
      tagsMegaCity: ["OPEN", "WET", "POWERED"],
      tagsDarkforest: ["OPEN", "WET"],
      coverSlots: 1,
    },
    {
      id: "N5",
      nameMegaCity: "Service Tunnel",
      nameDarkforest: "Buried Passage",
      tagsMegaCity: ["CRAMPED", "DARK"],
      tagsDarkforest: ["CRAMPED", "DARK"],
      coverSlots: 2,
    },
    {
      id: "N6",
      nameMegaCity: "Seed Vault",
      nameDarkforest: "Last Farm",
      tagsMegaCity: ["COVERED", "DENSE"],
      tagsDarkforest: ["COVERED", "DENSE"],
      coverSlots: 3,
    },
  ],
  edges: [
    { id: "e1", from: "N1", to: "N2", noLos: false, phase: "both" },
    { id: "e2", from: "N2", to: "N3", noLos: false, phase: "both" },
    { id: "e3", from: "N3", to: "N4", noLos: false, phase: "megacity" },
    { id: "e4", from: "N4", to: "N1", noLos: false, phase: "both" },
    { id: "e5", from: "N1", to: "N5", noLos: true, trait: "tunnel", phase: "both" },
    { id: "e6", from: "N5", to: "N6", noLos: true, trait: "tunnel", phase: "both" },
    { id: "e7", from: "N6", to: "N2", noLos: false, phase: "both" },
    { id: "r1", from: "N3", to: "N6", noLos: true, trait: "root", phase: "darkforest" },
  ],
  blockadeSchedule: [
    { previewAtMs: gm(6, 0), closesAtMs: gm(8, 0), node: "N5" },
    { previewAtMs: gm(24, 0), closesAtMs: gm(26, 0), node: "N4" },
  ],
  finalNodes: ["N1", "N2", "N3", "N6"],
  rootheartNodeId: "N1",
  shopNodeId: "N2",
};
