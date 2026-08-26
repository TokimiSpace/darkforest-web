**語言：** **繁體中文（預設）** · [English](README.en.md)

# Darkforest: Reset Protocol — Web Client

用 12 組已清理的本機情境，開發與測試 Darkforest 瀏覽器遊戲介面。

> [!WARNING]
> **防詐提醒 / Anti-fraud:** 任何以 @gmail.com 結尾、並自稱 Tokimi
> 的帳號都不是官方聯絡管道；請勿付款或提供驗證碼。 Any @gmail.com address claiming to represent
> Tokimi is not an official Tokimi contact channel; do not pay or share verification codes. 請只透過
> / Verify only through [tokimi.space](https://tokimi.space/) 或 / or
> [ben@tokimi.space](mailto:ben@tokimi.space)。

![Darkforest Web 開源前端](apps/web/static/art/placeholders/social-card.png)

[Tokimi](https://tokimi.space/) · [官方遊戲](https://darkforest.tw/) ·
[開源專案](https://tokimi.space/open-source/) ·
[Issues](https://github.com/TokimiSpace/darkforest-web/issues)

![pre-alpha](https://img.shields.io/badge/status-pre--alpha-f59e0b?style=flat-square)
![12 fixtures](https://img.shields.io/badge/fixtures-12-21bfae?style=flat-square)
![6 locales](https://img.shields.io/badge/locales-6-21bfae?style=flat-square)
![Apache-2.0](https://img.shields.io/badge/code-Apache--2.0-2563eb?style=flat-square)

> [!IMPORTANT]
> 這是 **pre-alpha 開源前端與 loopback-only fixture demo**，不是完整或可自行架設的官方遊戲。
> 正式配對、帳號、私人遊戲核心、權威結算、資料庫、營運工具與 production service contract
> 均未開源，也未承諾相容。

## 可以做什麼

| 本專案提供                                     | 本專案不包含                                     |
| ---------------------------------------------- | ------------------------------------------------ |
| Fresh/Preact 瀏覽器 UI                         | 正式配對、帳號或 session                         |
| 12 組 HUD、戰鬥、商店、救援與終局 fixtures     | private game core、規則引擎與正式平衡數值        |
| public-demo v1 schema 與 runtime parser        | production service contract 或相容性承諾         |
| 六語、響應式、鍵盤、reduced-motion 與 axe 測試 | 正式資料、replay、分析、反作弊或 live operations |

完整界線見[公開範圍](docs/PUBLIC_SCOPE.md)與[已知限制](docs/KNOWN_LIMITATIONS.md)。

## 本機啟動

安裝 [Deno](https://docs.deno.com/runtime/getting_started/installation/)（CI 使用 2.5.6）：

```sh
git clone https://github.com/TokimiSpace/darkforest-web.git
cd darkforest-web
deno task mock
```

另開終端機執行 `deno task dev`，再開啟
[http://localhost:8000/?fixture=openingMegaCity](http://localhost:8000/?fixture=openingMegaCity)。

瀏覽器只會連到 `ws://127.0.0.1:8788` 的 fixture server；不會連正式 API、分析服務、遠端字型或
翻譯服務。Mock server 僅供本機開發，請勿公開到 Internet。

## 畫面與架構

|                                          本機情境                                          |                                          Reset 地圖                                           |                                                                             公開裝備素材                                                                             |
| :----------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| <img src="apps/web/static/art/placeholders/scene.svg" width="260" alt="本機 fixture 情境"> | <img src="apps/web/static/art/reset/reset-map-fracture.svg" width="260" alt="Reset 地圖狀態"> | <img src="apps/web/static/art/icons/items/medkit-v3.svg" width="110" alt="醫療包"> <img src="apps/web/static/art/icons/weapons/rifle-v3.svg" width="110" alt="步槍"> |

這些是 repo 核准的 demo 素材，不是 production 畫面或正式美術包。

![Darkforest Web 本機架構與公開邊界](docs/assets/readme-architecture.svg)

瀏覽器、fixture server 與 `packages/protocol` 共用獨立的 public-demo v1 schema。WebSocket frame
會先通過結構 parser，但這不能取代伺服端授權、語意驗證、反作弊或正式安全設計。其他服務需自行實作
schema 或 adapter；這不代表與官方服務相容。

## Fixtures 與語言

| 類別       | 固定情境                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| 開場與操作 | `openingMegaCity`、`combatSkirmish`、`downedRescue`、`darkforestHazard`、`shopVisit`、`rejectionDrill` |
| 敘事與檢視 | `echoMode`、`legacyPrompt`、`replaySample`                                                             |
| 終局       | `finalReckoning`、`finalCovenant`、`finalAllDead`                                                      |

12 組 fixtures 都是 synthetic、deterministic、sanitized 的 UI 範例，不是 production replay，也不重現
私人演算法。介面支援 `zh-TW`（預設）、`zh-CN`、`en`、`ja`、`ko`、`vi`；文案是 public-demo
snapshot，不保證與正式服務相同。

## 開發與驗證

| 路徑                 | 用途                             |
| -------------------- | -------------------------------- |
| `apps/web/`          | Fresh/Preact UI 與六種語系       |
| `packages/protocol/` | public-demo types 與 parser      |
| `packages/fixtures/` | fixtures 與 loopback-only server |
| `qa/game-e2e/`       | Playwright、axe 與響應式 QA      |

| 命令              | 用途                       |
| ----------------- | -------------------------- |
| `deno task check` | 格式、lint、型別與單元測試 |
| `deno task ci`    | 完整公開範圍驗證與 build   |

瀏覽器 QA 見 [qa/game-e2e/README.md](qa/game-e2e/README.md)。提交前請閱讀
[CONTRIBUTING.md](CONTRIBUTING.md)，不要加入正式端點、私人來源、真實玩家資料或權利不明素材。

## 安全與授權

漏洞請透過
[GitHub Security Advisories](https://github.com/TokimiSpace/darkforest-web/security/advisories/new)
私下回報；未經書面授權，請勿測試正式服務。隱私與素材規則見
[PRIVACY.md](docs/PRIVACY.md)與[ASSET_PROVENANCE.md](docs/ASSET_PROVENANCE.md)。

本 repo 採路徑式多重授權：軟體與工具為 **Apache-2.0**；語系為 **Apache-2.0 OR CC BY 4.0**；
核准文件、fixture 敘事與非品牌 demo 內容為 **CC BY 4.0**。品牌與第三方內容依各檔案條款，且不授予
一般品牌使用權。權威範圍見 [LICENSES.md](LICENSES.md) 與 [TRADEMARKS.md](TRADEMARKS.md)。
