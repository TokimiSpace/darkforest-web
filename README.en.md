**Language:** [繁體中文](README.md) · **English**

# Darkforest: Reset Protocol — Web Client

Develop and test Darkforest's browser UI with 12 sanitized local scenarios.

![Darkforest Web open frontend](apps/web/static/art/placeholders/social-card.png)

[Tokimi](https://tokimi.space/) · [Official game](https://darkforest.tw/) ·
[Open source](https://tokimi.space/en/open-source/) ·
[Issues](https://github.com/TokimiSpace/darkforest-web/issues)

![pre-alpha](https://img.shields.io/badge/status-pre--alpha-f59e0b?style=flat-square)
![12 fixtures](https://img.shields.io/badge/fixtures-12-21bfae?style=flat-square)
![6 locales](https://img.shields.io/badge/locales-6-21bfae?style=flat-square)
![Apache-2.0](https://img.shields.io/badge/code-Apache--2.0-2563eb?style=flat-square)

> [!IMPORTANT]
> This is a **pre-alpha open-source frontend and loopback-only fixture demo**, not a complete or
> self-hostable official game. Production matchmaking, accounts, the private game core,
> authoritative resolution, databases, operations tooling, and the production service contract are
> not open sourced or promised to be compatible.

## What it provides

| Included                                                                  | Not included                                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Fresh/Preact browser UI                                                   | Production matchmaking, accounts, or sessions                       |
| 12 HUD, combat, shop, rescue, and ending fixtures                         | Private game core, rule engine, or official balance values          |
| Public-demo v1 schema and runtime parser                                  | Production service contract or compatibility promise                |
| Six locales, responsive layouts, keyboard, reduced-motion, and axe checks | Production data, replays, analytics, anti-cheat, or live operations |

See [Public scope](docs/PUBLIC_SCOPE.md) and [Known limitations](docs/KNOWN_LIMITATIONS.md) for the
complete boundary.

## Run locally

Install [Deno](https://docs.deno.com/runtime/getting_started/installation/) (CI uses 2.5.6):

```sh
git clone https://github.com/TokimiSpace/darkforest-web.git
cd darkforest-web
deno task mock
```

In another terminal, run `deno task dev`, then open
[http://localhost:8000/?fixture=openingMegaCity](http://localhost:8000/?fixture=openingMegaCity).

The browser connects only to the fixture server at `ws://127.0.0.1:8788`; it does not contact the
production API, analytics, remote fonts, or translation services. Do not expose this development
mock server to the Internet.

## Screens and architecture

|                                         Local scenario                                          |                                           Reset map                                            |                                                                         Public equipment art                                                                          |
| :---------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| <img src="apps/web/static/art/placeholders/scene.svg" width="260" alt="Local fixture scenario"> | <img src="apps/web/static/art/reset/reset-map-fracture.svg" width="260" alt="Reset map state"> | <img src="apps/web/static/art/icons/items/medkit-v3.svg" width="110" alt="Medkit"> <img src="apps/web/static/art/icons/weapons/rifle-v3.svg" width="110" alt="Rifle"> |

These are approved demo assets from this repository, not production screenshots or the official art
pack.

![Darkforest Web local architecture and publication boundary](docs/assets/readme-architecture.svg)

The browser, fixture server, and `packages/protocol` share a standalone public-demo v1 schema.
WebSocket frames cross a structural parser, but this does not replace server-side authorization,
semantic validation, anti-cheat, or production security. Another service must implement the schema
or an adapter; this does not imply compatibility with the official service.

## Fixtures and locales

| Group                | Fixed scenarios                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Opening and actions  | `openingMegaCity`, `combatSkirmish`, `downedRescue`, `darkforestHazard`, `shopVisit`, `rejectionDrill` |
| Narrative and review | `echoMode`, `legacyPrompt`, `replaySample`                                                             |
| Endings              | `finalReckoning`, `finalCovenant`, `finalAllDead`                                                      |

All 12 fixtures are synthetic, deterministic, sanitized UI examples—not production replays or
reproductions of private algorithms. The UI supports `zh-TW` (default), `zh-CN`, `en`, `ja`, `ko`,
and `vi`. Its copy is a public-demo snapshot, not a promise about the official service.

## Develop and verify

| Path                 | Purpose                                 |
| -------------------- | --------------------------------------- |
| `apps/web/`          | Fresh/Preact UI and six locale catalogs |
| `packages/protocol/` | Public-demo types and parser            |
| `packages/fixtures/` | Fixtures and loopback-only server       |
| `qa/game-e2e/`       | Playwright, axe, and responsive QA      |

| Command           | Purpose                                |
| ----------------- | -------------------------------------- |
| `deno task check` | Format, lint, type, and unit checks    |
| `deno task ci`    | Complete public-scope checks and build |

See [qa/game-e2e/README.md](qa/game-e2e/README.md) for browser QA. Before contributing, read
[CONTRIBUTING.md](CONTRIBUTING.md). Do not add production endpoints, private sources, real player
data, or material with unclear rights.

## Security and licensing

Report vulnerabilities privately through
[GitHub Security Advisories](https://github.com/TokimiSpace/darkforest-web/security/advisories/new).
Do not test a production service without written authorization. See [PRIVACY.md](docs/PRIVACY.md)
and [ASSET_PROVENANCE.md](docs/ASSET_PROVENANCE.md) for privacy and asset rules.

Licensing is path-specific: software and tooling are **Apache-2.0**; locale catalogs are
**Apache-2.0 OR CC BY 4.0**; approved documentation, fixture narrative, and non-brand demo content
are **CC BY 4.0**. Brand and third-party files retain their own terms and carry no general branding
grant. See [LICENSES.md](LICENSES.md) and [TRADEMARKS.md](TRADEMARKS.md).
