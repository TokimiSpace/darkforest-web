import type { Tag } from "@darkforest/protocol";

export interface WorldPlacePair {
  id: string;
  before: {
    name: string;
    nameKey: string;
    art: string;
    tags: readonly Tag[];
  };
  after: {
    name: string;
    nameKey: string;
    art: string;
    tags: readonly Tag[];
  };
  coverSlots: 1 | 2 | 3;
  story: string;
  tactic: string;
}

/**
 * Curated public-demo semantic place set. Runtime node ids and adjacency are deliberately absent;
 * the atlas describes presentation concepts and does not expose or claim a production map model.
 */
export const WORLD_PLACES = [
  {
    id: "rootheart",
    before: {
      name: "赤根",
      nameKey: "place.red_root",
      art: "/art/placeholders/scene.svg",
      tags: ["POWERED", "CRAMPED"],
    },
    after: {
      name: "Arbora 根心",
      nameKey: "place.arbora_rootheart",
      art: "/art/placeholders/scene.svg",
      tags: ["DENSE", "CRAMPED"],
    },
    coverSlots: 2,
    story:
      "城市曾把赤根當成輸送能源的機械器官；爆炸後，真正的根沿舊管線生長，開始保存每個來不及說完的記憶。",
    tactic:
      "兩個時代都很狹窄；工具與菜刀更能施展，步槍難以拉開距離。Darkforest 的最後答案也會在根心被提出。",
  },
  {
    id: "workshop",
    before: {
      name: "維修環廊",
      nameKey: "place.maintenance_ring",
      art: "/art/placeholders/scene.svg",
      tags: ["CRAMPED", "DEBRIS"],
    },
    after: {
      name: "野地工坊",
      nameKey: "place.field_workshop",
      art: "/art/placeholders/scene.svg",
      tags: ["CRAMPED", "DEBRIS"],
    },
    coverSlots: 3,
    story:
      "這一層從未出現在城市觀光圖上。Field Supply 讓無人保固的工具繼續工作；Reset 之後，庫存與未完成的修理一起留了下來。",
    tactic: "狹窄、碎片多，也有較多掩體。商店前後期都在這裡；購買會發出聲音，交易不是安全暫停。",
  },
  {
    id: "waterworks",
    before: {
      name: "水務站",
      nameKey: "place.waterworks",
      art: "/art/placeholders/scene.svg",
      tags: ["WET", "MUD"],
    },
    after: {
      name: "黑水沼澤",
      nameKey: "place.blackwater_marsh",
      art: "/art/placeholders/scene.svg",
      tags: ["WET", "MUD"],
    },
    coverSlots: 1,
    story:
      "Mega City 把乾淨的水當成理所當然，直到泵停下來。過濾槽、管橋與泥沙沒有消失，只是一起沉進黑水。",
    tactic: "泥地會拖慢移動，濕地更容易滑倒；這裡只有少量掩體，先想好離開方向再搜尋。",
  },
  {
    id: "atrium",
    before: {
      name: "奢華中庭",
      nameKey: "place.luxury_atrium",
      art: "/art/placeholders/scene.svg",
      tags: ["OPEN", "WET", "POWERED"],
    },
    after: {
      name: "淹沒中庭",
      nameKey: "place.flooded_atrium",
      art: "/art/placeholders/scene.svg",
      tags: ["OPEN", "WET"],
    },
    coverSlots: 1,
    story:
      "上層把水做成景觀，卻把老化電纜藏在地板下。爆炸掀掉奢華表面，黑水淹過家具，危險反而變得誠實。",
    tactic:
      "視線開闊、掩體稀少。導電積水在兩個時代都可能存在，但起初不會替你標出來；掃描或繞路才可靠。",
  },
  {
    id: "archive",
    before: {
      name: "市政檔案館",
      nameKey: "place.civic_archive",
      art: "/art/placeholders/scene.svg",
      tags: ["CRAMPED", "DARK"],
    },
    after: {
      name: "埋沒檔案館",
      nameKey: "place.buried_archive",
      art: "/art/placeholders/scene.svg",
      tags: ["CRAMPED", "DARK"],
    },
    coverSlots: 3,
    story:
      "檔案館把人的一生壓成編號與權限。Darkforest 沒有讀懂那些分類，只把資料架包成一座仍在低聲作響的墓室。",
    tactic: "暗、窄、掩體多。近身武器與藏匿較有利；看見輪廓不代表已經知道對方是誰。",
  },
  {
    id: "spire",
    before: {
      name: "議會尖塔",
      nameKey: "place.council_spire",
      art: "/art/placeholders/scene.svg",
      tags: ["OPEN", "COVERED"],
    },
    after: {
      name: "樹冠尖塔",
      nameKey: "place.canopy_spire",
      art: "/art/placeholders/scene.svg",
      tags: ["OPEN", "COVERED"],
    },
    coverSlots: 2,
    story:
      "議會曾從高處決定哪些街區值得被看見。塔身傾斜以後，樹冠接手那個視野，長桌與窗框仍留在原位。",
    tactic:
      "長視線與可用掩體同時存在。遠程武器有施展空間，但對手也有地方消失；相信 Preview，不要只看距離。",
  },
  {
    id: "broadcast",
    before: {
      name: "廣播廳",
      nameKey: "place.broadcast_hall",
      art: "/art/placeholders/scene.svg",
      tags: ["CRAMPED", "DARK"],
    },
    after: {
      name: "低語廳",
      nameKey: "place.whisper_hall",
      art: "/art/placeholders/scene.svg",
      tags: ["DENSE", "DARK"],
    },
    coverSlots: 2,
    story:
      "擴音器曾把同一句命令送進每條街。爆炸讓喇叭沉默，根與葉卻把殘留的聲音拆成無法確定來源的低語。",
    tactic: "前期是狹窄暗室，後期變成深密暗區。Darkforest 更容易埋伏，也更需要先辨認人影再出手。",
  },
  {
    id: "farm",
    before: {
      name: "種子庫",
      nameKey: "place.seed_vault",
      art: "/art/placeholders/scene.svg",
      tags: ["COVERED", "DENSE"],
    },
    after: {
      name: "最後農場",
      nameKey: "place.last_farm",
      art: "/art/placeholders/scene.svg",
      tags: ["COVERED", "DENSE"],
    },
    coverSlots: 3,
    story:
      "城市把種子當作災難備份，卻很少讓它們接觸泥土。當庫門裂開，保存品第一次成為農作，也成為 Field Supply 留給未來的證詞。",
    tactic: "掩體與遮蔽都很強，適合救人、藏身與設伏。ROOTBOUND 也能在這裡以救援修補破裂的誓約。",
  },
  {
    id: "stormperch",
    before: {
      name: "氣象塔",
      nameKey: "place.weather_tower",
      art: "/art/placeholders/scene.svg",
      tags: ["OPEN", "POWERED"],
    },
    after: {
      name: "風暴棲臺",
      nameKey: "place.stormperch",
      art: "/art/placeholders/scene.svg",
      tags: ["OPEN", "WET"],
    },
    coverSlots: 1,
    story:
      "氣象塔曾宣稱能預測城市上空的一切。Reset 之後，控制面板只剩雨水；高塔不再命名風暴，只能承受它。",
    tactic: "兩個時代都非常開闊。前期留意帶電設備，後期留意濕滑地面；少量掩體讓每次停留都很顯眼。",
  },
  {
    id: "well",
    before: {
      name: "貨運豎井",
      nameKey: "place.freight_well",
      art: "/art/placeholders/scene.svg",
      tags: ["OPEN", "DARK"],
    },
    after: {
      name: "空洞豎井",
      nameKey: "place.hollow_well",
      art: "/art/placeholders/scene.svg",
      tags: ["OPEN", "DARK"],
    },
    coverSlots: 1,
    story:
      "貨物在巨井中被稱重、升降，人的名字只留在交接欄。升降機停住後，深井仍把腳步聲送往看不見的樓層。",
    tactic: "開闊與黑暗的修正彼此拉扯，不能簡化成純粹的遠程優勢；掩體很少，Preview 才是最後判斷。",
  },
  {
    id: "watch",
    before: {
      name: "邊境兵營",
      nameKey: "place.border_barracks",
      art: "/art/placeholders/scene.svg",
      tags: ["COVERED", "DENSE"],
    },
    after: {
      name: "殘破哨站",
      nameKey: "place.fallen_watch",
      art: "/art/placeholders/scene.svg",
      tags: ["COVERED", "DENSE"],
    },
    coverSlots: 3,
    story:
      "兵營的射擊孔原本用來區分城內與城外。牆倒之後，床架、藤蔓與觀察孔仍教每個經過的人如何躲起來看別人。",
    tactic: "掩體多、輪廓難讀，是藏匿與伏擊的強勢地點。進場先觀察，不要把安靜誤認成無人。",
  },
  {
    id: "rail",
    before: {
      name: "逃生鐵道",
      nameKey: "place.escape_rail",
      art: "/art/placeholders/scene.svg",
      tags: ["OPEN", "DEBRIS"],
    },
    after: {
      name: "鏽蝕鐵道",
      nameKey: "place.rust_line",
      art: "/art/placeholders/scene.svg",
      tags: ["OPEN", "DEBRIS"],
    },
    coverSlots: 1,
    story:
      "逃生鐵道的名字是一個從未被兌現的承諾。車廂離開後，軌道留在原地生鏽，繼續把倖存者引向彼此。",
    tactic: "長直線讓遠程與大幅揮擊有空間，碎片卻會妨礙腳步。掩體少，開火與趕路都很容易留下痕跡。",
  },
] as const satisfies readonly WorldPlacePair[];
