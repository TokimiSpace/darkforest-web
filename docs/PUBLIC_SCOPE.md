# Public scope

## Release statement

This repository is the **open-source Darkforest browser client and local demo; server and game core
not included; pre-alpha**. It is not the complete Darkforest service and is not a self-hostable copy
of the official game.

## Included

| Category              | Public material                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Browser frontend      | Player-facing routes, components, CSS, browser runtime, six locales, and synthetic product-concept presentation states |
| Demo interoperability | Sanitized public-demo schema v1, units, runtime parser, and safe inbound-message boundary                              |
| Presentation data     | Manually curated values rendered by the demo UI; no private source lineage or unused weights                           |
| Local development     | Twelve synthetic/sanitized fixtures and a loopback-only mock                                                           |
| Verification          | Unit tests, browser/axe QA, generated-browser sync, publication, rights, and asset gates                               |
| Governance            | Architecture, security, privacy, licensing, contribution, provenance, and limitations                                  |
| Creative material     | Curated player-facing demo copy plus manifest-approved demo assets under their stated licenses                         |

The committed six-locale copy is an intentional, versioned public-demo snapshot. It is licensed as
stated in `LICENSES.md`; it is not a promise that the official service uses the same wording,
values, or content.

Synthetic queue, lobby, and spectator-waiting shapes are included only as client-side
product-concept presentation. The local fixture server does not emit or operate them. No
corresponding matchmaking, account/session, admission, or spectator service is included.

## Excluded

| Category              | Material not published here                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| Authoritative service | Match server, action resolution, matchmaking, persistence, anti-cheat, and moderation                    |
| Private core          | Rule engine, randomness, map generation, simulation, replay verification, authoritative balance          |
| Production contract   | Official service wire version, compatibility guarantees, authentication, and provider integrations       |
| Operations            | Admin/analytics/billing tools, databases, production deployment config, credentials, and live procedures |
| Content pipeline      | Unreleased/full authored content libraries, raw source art/prompts, authoring tools, and future packs    |
| Sensitive data        | Tokens, player/account data, production replays/logs, databases, and local environment files             |
| Internal material     | Private history/metadata, audits, commercial strategy, pricing, roadmap, and handoff documents           |
| Restricted assets     | Promo-derived, third-party NFT/branded, unreviewed stock, or otherwise uncleared material                |

The absence of a private component is not permission to access, reverse engineer, or test an
official service.

## Extraction rules

Public source is assembled by allowlist into a clean Git history. Each candidate must pass technical
dependency, secret/endpoint/path/data, content/rights, documentation, and clean-build review.
Ignored files are not automatically safe; caches, local environments, authoring workspaces, replay
directories, and agent/editor metadata stay out.

## Presentation-data rule

A value may enter `packages/client-data` only when the public UI actually renders or derives a
visible state from it, the value is safe to license, and it does not reveal a private algorithm or
unused tuning. The package is a manually curated public-demo snapshot, not generated from or
drift-checked against a private source. When uncertain, use a synthetic example or publish only an
interface.

## Network behavior

Build, test, and local demo paths are local-only. They do not contact the official game, telemetry,
translation, advertising, fonts, or remote media. Links to [darkforest.tw](https://darkforest.tw/)
and [tokimi.space](https://tokimi.space/) are navigation only.

Any scope expansion requires maintainer review for private leakage, client/server trust boundaries,
privacy, license compatibility, identity/third-party rights, and clean-clone reproducibility.
