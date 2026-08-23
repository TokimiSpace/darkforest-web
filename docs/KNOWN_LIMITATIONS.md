# Known limitations

Darkforest Web is pre-alpha. These limitations are part of the public release boundary, not hidden
features.

## Product scope

- The repository is a frontend and local demo, not a complete self-hostable game.
- It does not include the production match server, private game core, matchmaking, persistence,
  accounts, moderation, anti-cheat, admin, analytics, or live operations.
- The twelve sanitized fixtures demonstrate UI states; they do not reproduce production transitions
  or authoritative rules.
- A curated six-locale player-facing copy snapshot is intentionally included. Unreleased copy
  libraries, the authoring pipeline, production art, and future content packs are not.

## Compatibility

- The standalone public-demo contract currently reports protocol version 1. Pre-alpha compatibility
  may break when that number changes.
- An independently implemented server must supply its own validation, resolution, persistence,
  security, and operational behavior.
- The public-demo schema is intentionally independent from the official service contract. Passing a
  fixture does not prove official compatibility.
- Official production endpoints are not configured and are not covered by local-demo support.

## Security

- The mock is development tooling, must remain loopback-only, and is not hardened for public
  hosting.
- The bounded runtime parser performs structural checks; it is not a complete semantic validator.
  Client-side validation and hidden UI do not provide authorization or anti-cheat protection.
- Production authentication and session handling are intentionally absent. A live integration
  requires a separate security review.
- The source release cannot guarantee the security, privacy, availability, or behavior of a fork or
  third-party deployment.

## UI and accessibility

- Responsive and accessibility tests cover selected paths and viewports, not every browser,
  assistive technology, locale, zoom level, or input combination.
- Game-state density, localization expansion, touch targets, focus management, reduced motion,
  contrast, and screen-reader announcements require continued testing.
- Six locales are included, but translation quality and terminology may evolve during pre-alpha.

## Assets and content

- Production art, unreleased content, and content-authoring sources are not included. The licensed
  demo-copy snapshot and manifest-approved placeholder assets are included deliberately.
- Promotional-video-derived and third-party NFT/branded material is excluded.
- Only assets with approved provenance, license, and SHA-256 records may ship.
- AI-assisted content, where present, is subject to human review but no automated review can
  guarantee that every similarity or rights concern has been detected.

## Release maturity

- APIs, file layout, tasks, fixtures, and documentation may change before `v1.0.0`.
- There is no support, uptime, compatibility, or remediation SLA.
- The applicable licenses disclaim warranties; evaluate the software for your own use.

Track actionable bugs in the public issue tracker without posting vulnerabilities, secrets, personal
data, production logs, or excluded content.
