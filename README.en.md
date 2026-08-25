**Language:** [繁體中文](README.md) · **English**

# Darkforest: Reset Protocol — Web Client

**Understand and improve Darkforest's browser game UI through 12 sanitized, reproducible local
scenarios.**

![Darkforest Web open frontend workbench](apps/web/static/art/placeholders/social-card.png)

[Tokimi](https://tokimi.space/) · [Play the official version](https://darkforest.tw/) ·
[Explore open source](https://tokimi.space/en/open-source/) ·
[Report an issue](https://github.com/TokimiSpace/darkforest-web/issues)

![Status: pre-alpha](https://img.shields.io/badge/status-pre--alpha-f59e0b?style=flat-square)
![Scenarios: 12 fixtures](https://img.shields.io/badge/fixtures-12-21bfae?style=flat-square)
![Languages: 6 locales](https://img.shields.io/badge/locales-6-21bfae?style=flat-square)
![Runtime: Deno 2.5.6](https://img.shields.io/badge/Deno-2.5.6-111827?style=flat-square)
![Code: Apache-2.0](https://img.shields.io/badge/code-Apache--2.0-2563eb?style=flat-square)
![Approved content: CC BY 4.0](https://img.shields.io/badge/content-CC_BY_4.0-16a34a?style=flat-square)

> [!IMPORTANT]
> This is an **open-source frontend and local fixture demo**, not a complete game server. Production
> matchmaking, accounts, the private game core, authoritative resolution, databases, operations
> tooling, and the official service contract are not open sourced or claimed to be compatible. This
> project is pre-alpha and is not a self-hostable official multiplayer game.

## At a glance

| What you can do here                                                              | What is deliberately absent                                         |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Start the Fresh/Preact browser UI                                                 | Production matchmaking, player accounts, or sessions                |
| Walk through HUD, combat, shop, rescue, and ending states with 12 fixed scenarios | The private game core, rule engine, or authoritative balance values |
| Inspect the public-demo v1 schema and runtime parser                              | The production service contract or a compatibility promise          |
| Verify six locales, responsive layouts, keyboard use, reduced motion, and axe     | Production data, replays, analytics, anti-cheat, or live operations |
| Contribute without an account, token, or official endpoint                        | Production deployment, secrets, or the unreleased content pipeline  |

See [Public scope](docs/PUBLIC_SCOPE.md) and [Known limitations](docs/KNOWN_LIMITATIONS.md) for the
complete boundary.

## Start the local demo in 30 seconds

Install [Deno](https://docs.deno.com/runtime/getting_started/installation/) first. Project CI is
pinned to **Deno 2.5.6**. Clone the repository, then open two terminals:

```sh
git clone https://github.com/TokimiSpace/darkforest-web.git
cd darkforest-web
```

**Terminal A — start the loopback-only fixture server:**

```sh
deno task mock
```

**Terminal B — start the web app:**

```sh
deno task dev
```

Open
[http://localhost:8000/?fixture=openingMegaCity](http://localhost:8000/?fixture=openingMegaCity).
With dependencies cached, the demo is normally visible in about 30 seconds. The first run downloads
the locked dependencies, so its duration depends on your network.

The entire local data flow is:

```text
browser http://localhost:8000
   ↕ WebSocket
fixture ws://127.0.0.1:8788/ws?fixture=openingMegaCity
```

It does not silently contact `darkforest.tw`, analytics, remote fonts, translation services, or a
production API. The mock server is local development support; do not expose it to the Internet.

## What you will see

|                                                    Local scenario surface                                                     |                                                Reset map state                                                |                                                                              Public equipment art                                                                               |
| :---------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| <img src="apps/web/static/art/placeholders/scene.svg" width="260" alt="Code-native placeholder for a local fixture scenario"> | <img src="apps/web/static/art/reset/reset-map-fracture.svg" width="260" alt="Reset map fracture state layer"> | <img src="apps/web/static/art/icons/items/medkit-v3.svg" width="110" alt="Medkit icon"> <img src="apps/web/static/art/icons/weapons/rifle-v3.svg" width="110" alt="Rifle icon"> |
|                                     Fixed-data presentation, not a production screenshot                                      |                                     Inspect state changes and legibility                                      |                                                                   Manifest-approved, code-native demo assets                                                                    |

The frontend includes lobby and profile drafts, a tactical HUD, fog and routes, equipment and
durability, combat previews, downed rescue, a shop, Echo/Arbora presentation, endings, tutorial,
record surfaces, accessibility settings, and a UI Lab. Some queue and spectator surfaces are only
synthetic product concepts; the fixture server does not emit or operate those states.

> [!NOTE]
> The images above are approved local-demo assets from this repository, not the production art pack.
> Production artwork, promo-derived material, unreleased narrative libraries, and raw authoring
> sources are not included.

## Architecture and trust boundary

![Darkforest Web local-demo architecture and publication boundary](docs/assets/readme-architecture.svg)

The browser, fixture server, and `packages/protocol` share one standalone public-demo v1 schema.
Every WebSocket frame crosses a bounded structural parser before entering the UI. That improves
handling of untrusted input, but it does **not** replace server-side authorization, semantic
validation, anti-cheat, or a production security design.

Any other service must explicitly implement this public-demo schema or provide its own adapter. That
does not create compatibility with the official service. Read [Architecture](docs/ARCHITECTURE.md)
and the [Client contract](docs/CLIENT_CONTRACT.md) for details.

## 12 fixtures, 6 locales

| Group                | Fixed scenarios                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Opening and actions  | `openingMegaCity`, `combatSkirmish`, `downedRescue`, `darkforestHazard`, `shopVisit`, `rejectionDrill` |
| Narrative and review | `echoMode`, `legacyPrompt`, `replaySample`                                                             |
| Endings              | `finalReckoning`, `finalCovenant`, `finalAllDead`                                                      |

These fixtures are synthetic, deterministic, sanitized UI examples—not production replays or
reproductions of private algorithms. See the current list on the mock server home page or at
`http://127.0.0.1:8788/fixtures`.

The interface ships with:

- 繁體中文 `zh-TW` (default)
- 简体中文 `zh-CN`
- English `en`
- 日本語 `ja`
- 한국어 `ko`
- Tiếng Việt `vi`

The six-language copy is a versioned public-demo snapshot. It does not promise that the official
service uses the same wording, values, or content.

## Repository map

| Path                    | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `apps/web/`             | Fresh/Preact routes, browser UI, styles, and six locale catalogs         |
| `packages/protocol/`    | Public-demo types, units, and runtime parser                             |
| `packages/client-data/` | Manually curated values that the public UI needs to display              |
| `packages/fixtures/`    | 12 sanitized scenarios and the loopback-only mock server                 |
| `qa/game-e2e/`          | Playwright and axe verification across desktop, portrait, and landscape  |
| `scripts/`              | Build, asset, publication-boundary, and generated-output checks          |
| `docs/`                 | Architecture, privacy, licensing, provenance, and public-scope documents |

## Common commands

| Command           | Purpose                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| `deno task mock`  | Start the fixed fixture server on `127.0.0.1:8788`                         |
| `deno task dev`   | Start the development web app on `localhost:8000`                          |
| `deno task check` | Format, lint, types, generated client, and tests                           |
| `deno task test`  | Unit and publication-gate tests                                            |
| `deno task build` | Create a production-mode frontend bundle (not an official-game deployment) |
| `deno task ci`    | Run the complete public-scope quality gate                                 |

Commands should use only the Deno permissions declared by workspace tasks. Read `deno.json` before
granting wider permissions.

To run the isolated browser QA suite:

```sh
cd qa/game-e2e
npm ci --ignore-scripts --omit=optional
npm audit --audit-level=high
npm test
```

QA covers all 12 fixtures, six locales, core interaction paths, selected desktop/portrait/landscape
viewports, critical axe violations, reduced motion, horizontal overflow, and blocking non-loopback
requests. See [qa/game-e2e/README.md](qa/game-e2e/README.md) for details.

## Contributing

1. Read the [Contribution guide](CONTRIBUTING.md), [Public scope](docs/PUBLIC_SCOPE.md), and
   [Code of Conduct](CODE_OF_CONDUCT.md).
2. Pick a [public issue](https://github.com/TokimiSpace/darkforest-web/issues), or propose a focused
   change before starting a large patch.
3. Stay local-first; do not add production endpoints, private sources, real player data, or material
   with unclear rights.
4. Run `deno task ci` before submitting. UI changes should also include keyboard, touch, responsive,
   and accessibility evidence.

Open an issue before changing the protocol, public/private boundary, authentication assumptions,
licensing, or asset policy.

## Security, privacy, and asset rights

- Report vulnerabilities privately through
  [GitHub Security Advisories](https://github.com/TokimiSpace/darkforest-web/security/advisories/new).
  Do not disclose an unpatched issue publicly.
- Do not test `darkforest.tw` or another production service without written authorization.
- The local demo needs no production credentials, analytics, or player account. It stores only the
  local UI drafts, preferences, and bounded session-prompt state listed in the
  [Privacy boundary](docs/PRIVACY.md).
- Every distributable asset needs source, license, SHA-256, and approval status. See
  [Asset provenance](docs/ASSET_PROVENANCE.md) and
  [AI-assisted content](docs/AI_ASSISTED_CONTENT.md).
- Forks may truthfully identify their source, but must not imply an official Tokimi or Darkforest
  release. See [Project identity](TRADEMARKS.md).

## Licensing

This is a path-specific multi-license repository:

- software, protocol types, build, tests, CI, and tooling: **Apache-2.0**;
- locale catalogs: **Apache-2.0 OR CC BY 4.0**;
- approved documentation, fixture narrative, and non-brand demo content: **CC BY 4.0**;
- brand files and third-party content: their file-specific terms, with no general branding grant.

See [LICENSES.md](LICENSES.md) for the authoritative scope, [Commercial use](docs/COMMERCIAL_USE.md)
for practical boundaries, [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for dependencies and
attribution policy, and [TRADEMARKS.md](TRADEMARKS.md) for project identity.
