# Licensing

Darkforest Web is a path-specific multi-license repository. It is not licensed as one indivisible
work under a single license. This document defines the repository's default license map; a valid
file-level SPDX notice or an explicit third-party notice takes priority.

## License map

| Material                                                                    | SPDX identifier                                      | License text                                                             |
| --------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Software, protocol definitions, build configuration, tests, CI, and tooling | `Apache-2.0`                                         | [Apache License 2.0](LICENSES/Apache-2.0.txt)                            |
| Project-authored locale catalogs                                            | `Apache-2.0 OR CC-BY-4.0`                            | Both license texts in `LICENSES/`                                        |
| Approved original documentation and non-brand demo content                  | `CC-BY-4.0`                                          | [Creative Commons Attribution 4.0 International](LICENSES/CC-BY-4.0.txt) |
| Included project logo/brand files explicitly mapped in `REUSE.toml`         | `LicenseRef-TokimiSpace-Brand`                       | [Brand asset terms](LICENSES/LicenseRef-TokimiSpace-Brand.txt)           |
| Approved third-party material                                               | As stated per file and in the asset manifest/notices | [Third-party notices](THIRD_PARTY_NOTICES.md)                            |

The root [LICENSE](LICENSE) is an unmodified Apache License 2.0 text so software tooling can
identify the primary code license.

## Apache-2.0 scope

Unless a file says otherwise, Apache-2.0 applies to:

- source code under `apps/` except approved creative media; locale catalogs are available under
  Apache-2.0 or, at the recipient's option, CC-BY-4.0;
- protocol, client-data code, fixture infrastructure, and mock-server code under `packages/` except
  approved scenario narrative content;
- test and QA code;
- scripts, build configuration, CI workflows, dependency manifests, and lockfiles;
- machine-readable publication, security, and asset metadata.

Under Apache-2.0 section 5, a contribution intentionally submitted for inclusion is licensed under
Apache-2.0 unless the contributor conspicuously says otherwise and the maintainers agree before
inclusion.

## CC-BY-4.0 scope

Unless a file says otherwise, CC-BY-4.0 applies to:

- original Markdown documentation at the repository root and under `docs/`;
- approved non-brand scenario content under `packages/fixtures/src/scenarios/`;
- approved non-brand demo images, audio, and similar creative media explicitly listed in the
  canonical asset manifest as `CC-BY-4.0`.

A reasonable attribution for CC-BY-4.0 material identifies the work or file, credits **TokimiSpace
contributors**, links to the [source repository](https://github.com/TokimiSpace/darkforest-web) when
practical, links to [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), and states whether
changes were made. Attribution does not imply endorsement or official-product status.

The included locale catalogs are dual-licensed under `Apache-2.0 OR CC-BY-4.0`; a recipient may
follow either license. They contain an intentional, versioned snapshot of released player-facing
demo copy. Unreleased copy libraries and the content-authoring pipeline are not included.

## Explicit exclusions

The licenses in this repository do **not** grant rights in material that is not included, including:

- the private Darkforest game core, match server, live operations, databases, production deployment
  configuration, or production content pack;
- production artwork and private source material;
- promotional-video-derived material;
- third-party NFT/branded media, characters, logos, slogans, or other externally controlled content;
- third-party brands, media, fonts, audio, or code not explicitly included with a compatible notice;
- Tokimi, TokimiSpace, Darkforest, or Reset Protocol project names, logos, and visual identity
  except for license-required attribution and truthful factual reference.

See [TRADEMARKS.md](TRADEMARKS.md). This repository makes no claim that any project name or mark is
registered.

The brand assets currently included at `apps/web/static/art/brand/**` and
`apps/web/static/favicon.svg` are not CC-BY-4.0 demo content. They use
`LicenseRef-TokimiSpace-Brand`. Unmodified source copies and mirrors may retain those exact files;
forks may also display them only to identify an otherwise unmodified build as the original project.
A modified or separately operated product should replace them with its own identity and must not
imply TokimiSpace endorsement. An `approved` publication-manifest status means the reviewed bytes
may appear in this repository; it does not grant a general branding right.

## Contributions and third-party material

Contributors may only submit material they are authorized to license. Preserve existing copyright,
patent, attribution, and license notices. Do not submit copied production content, NFT-associated
media, promotional references, stock media, model outputs with unclear terms, or assets found online
merely because they are publicly accessible.

Dependencies downloaded by package tooling are not relicensed by this repository. They remain
governed by their upstream licenses. Binary or hosted distributions must retain all notices required
by the exact resolved dependency set.

The canonical machine-readable defaults are in [REUSE.toml](REUSE.toml). If `REUSE.toml`, this
document, a file notice, and a third-party notice conflict, stop distribution and open an issue for
a rights review rather than guessing.
