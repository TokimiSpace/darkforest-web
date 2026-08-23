# Third-party notices

Darkforest Web uses open-source dependencies resolved by Deno. Each dependency remains governed by
its upstream license; Apache-2.0 and CC-BY-4.0 in this repository do not relicense dependency code.

## Dependency notices

The committed `deno.lock` is the authoritative resolution record for a source revision. Direct
imports and their license metadata are declared in the workspace and source files. Before publishing
a binary bundle, container, hosted artifact, or release archive, maintainers must:

1. resolve dependencies from the frozen lockfile;
2. produce a license inventory for the exact resolved graph;
3. retain upstream copyright and attribution notices;
4. include any license texts required for redistribution;
5. stop the release if a dependency has missing or incompatible license metadata.

A package name, website link, or compatibility reference is factual identification and does not
imply endorsement by its author.

The initial workspace declares these direct external packages:

| Package                                                                        | Pinned version | Upstream license |
| ------------------------------------------------------------------------------ | -------------: | ---------------- |
| [Deno Standard Library — `@std/assert`](https://jsr.io/@std/assert)            |         1.0.19 | MIT              |
| [Fresh — `@fresh/core`](https://jsr.io/@fresh/core)                            |          2.3.3 | MIT              |
| [Fresh Vite plugin — `@fresh/plugin-vite`](https://jsr.io/@fresh/plugin-vite)  |          1.1.2 | MIT              |
| [Preact](https://www.npmjs.com/package/preact)                                 |        10.29.1 | MIT              |
| [Preact Render to String](https://github.com/preactjs/preact-render-to-string) |          6.7.0 | MIT              |
| [Vite](https://www.npmjs.com/package/vite)                                     |          7.3.6 | MIT              |
| [Playwright Test](https://playwright.dev/)                                     |         1.62.1 | Apache-2.0       |
| [axe-core Playwright](https://github.com/dequelabs/axe-core-npm)               |         4.12.1 | MPL-2.0          |

This direct-dependency table is not a substitute for a complete resolved-graph notice. The lockfile
and release inventory control when versions change or transitive packages are distributed.

## Creative assets

No external creative asset may be distributed merely because it is reachable online or appeared in a
private prototype. Every distributable image, audio file, font, animation, model, or similar asset
must have an approved entry in the canonical asset manifest described in
[docs/ASSET_PROVENANCE.md](docs/ASSET_PROVENANCE.md).

This public source release excludes:

- promotional-video-derived material;
- third-party NFT-associated media and branded narrative content;
- unreviewed stock, social-media, search-result, or third-party website media;
- remote fonts or assets without an approved redistributable license;
- production content whose public redistribution was not separately approved.

If third-party material is approved in the future, its manifest entry and adjacent notice must
identify the creator, source URL, exact license/version, required attribution, modification status,
and review date. The more specific notice takes priority over repository defaults.
