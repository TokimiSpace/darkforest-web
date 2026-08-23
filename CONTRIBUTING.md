# Contributing

Thanks for helping improve Darkforest Web. This repository is intentionally limited to the browser
client, public client contract, player-visible data, sanitized local fixtures, and their tests and
documentation.

## Before opening a pull request

1. Read [Public scope](docs/PUBLIC_SCOPE.md), [Architecture](docs/ARCHITECTURE.md), and
   [Security policy](SECURITY.md).
2. Open an issue before changing the client contract, public/private boundary, authentication
   assumptions, licensing, or asset policy.
3. Keep production endpoints opt-in. Local development must remain loopback-first and usable without
   private credentials.
4. Do not copy code, documentation, narrative, artwork, prompts, environment files, Git history, or
   operational information from a private repository unless the material is explicitly approved for
   this public repository.
5. Do not submit secrets, production data, personal data, replay data, or screenshots containing
   private or excluded content.

## Development workflow

Create a branch, make a focused change, and run:

```sh
deno task check
deno task test
deno task build
deno task ci
```

A pull request should explain what changed, why it stays within the public boundary, what was
tested, and any accessibility, privacy, security, compatibility, or asset impact.

## Protocol changes

- Prefer additive, backward-compatible fields.
- Update types, validators, fixtures, tests, and [Client contract](docs/CLIENT_CONTRACT.md)
  together.
- Increment the exported protocol version for a breaking wire change.
- Do not publish server-only validation or private rule-engine behavior through a convenient shared
  import.

## UI changes

- Test keyboard and touch input.
- Verify desktop, portrait mobile, and landscape mobile layouts.
- Preserve visible focus, meaningful labels, reduced-motion behavior, and readable state changes.
- Check all six locales, including wrapping and truncation.
- Avoid adding analytics, remote media, trackers, or production network calls.

## Asset and content changes

Every new or modified creative asset requires:

- editable/source provenance where available;
- a SHA-256 hash in the canonical asset manifest;
- creator/source, publication status, SPDX license, and modification notes;
- confirmation that it is non-brand demo content or separately authorized third-party material;
- an update to [Asset provenance](docs/ASSET_PROVENANCE.md) when policy or status changes.

Do not contribute production artwork, promotional-video-derived assets, third-party NFT/branded
media, or AI-assisted output without documented tool terms, inputs, prompts/parameters where
retainable, and human rights review.

## Licensing contributions

By submitting a contribution for inclusion, you represent that you have the necessary rights and
agree that it may be distributed under the path-specific license documented in
[LICENSES.md](LICENSES.md). Code is normally Apache-2.0; locale catalogs are
`Apache-2.0 OR CC-BY-4.0`; approved documentation and non-brand demo content are normally CC-BY-4.0.
Maintainers may ask for clearer provenance or decline material whose rights cannot be verified.

All contributors must follow the [Code of Conduct](CODE_OF_CONDUCT.md).
