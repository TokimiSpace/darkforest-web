# Changelog

Notable public changes are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and tagged releases will use
[Semantic Versioning](https://semver.org/) where practical. During pre-alpha, the client contract
may change incompatibly between minor releases.

## [Unreleased]

### Added

- Initial clean-history public extraction of the Darkforest browser client.
- Public client wire contract and player-visible client-data boundary.
- Loopback-only mock service with twelve sanitized demo scenarios.
- English and Traditional Chinese project documentation.
- Path-specific Apache-2.0 and CC-BY-4.0 licensing and asset-provenance gates.

### Security

- Public demo defaults to a local endpoint and does not require production credentials.
- Publication checks reject known private paths, secrets, unapproved assets, and unsafe endpoint
  defaults.
