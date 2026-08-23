import type { NodeView } from "@darkforest/protocol";

export function shopView(
  stockLeft: { stab_jacket?: number; composite_chest?: number; nvg_helmet?: number } = {},
): NonNullable<NodeView["shop"]> {
  return {
    catalog: [
      { item: "light_ammo", buyPrice: 20, sellPrice: 8 },
      { item: "bandage", buyPrice: 25, sellPrice: 10 },
      { item: "medkit", buyPrice: 60, sellPrice: 24 },
      { item: "healthy_food", buyPrice: 30, sellPrice: 12 },
      { item: "scrap", buyPrice: 15, sellPrice: 6 },
      { item: "stab_jacket", buyPrice: 80, sellPrice: 32, stockLeft: stockLeft.stab_jacket ?? 2 },
      {
        item: "composite_chest",
        buyPrice: 150,
        sellPrice: 60,
        stockLeft: stockLeft.composite_chest ?? 1,
      },
      { item: "nvg_helmet", buyPrice: 150, sellPrice: 60, stockLeft: stockLeft.nvg_helmet ?? 1 },
    ],
  };
}
