# Privacy boundary

## Repository and local demo

This repository is source code, not the production Darkforest service. The bundled demo is intended
to run locally without a player account, production credential, analytics identifier, advertising
SDK, or production database.

Default local traffic stays between:

- the browser and `localhost:8000`;
- the browser and the fixture WebSocket on `127.0.0.1:8788`.

Build, test, and demo tasks must not silently contact official game, analytics, translation, font,
media, advertising, or social services. Informational links to
[darkforest.tw](https://darkforest.tw/) and [tokimi.space](https://tokimi.space/) navigate only when
a user chooses them.

## Local browser data

The included client currently stores these local-only values:

| Storage                            | Key                                 | Value                                                                    | Retention                                     |
| ---------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| Local storage and same-site cookie | `darkforest-locale-v1`, `df_locale` | Selected interface locale                                                | Until cleared; cookie maximum age is one year |
| Local storage                      | `darkforest-profile-draft-v1`       | Display-name draft, faction, and two optional quotes                     | Until cleared or overwritten                  |
| Local storage                      | `darkforest-tutorial-v1`            | Completed tutorial-step indexes                                          | Until cleared or overwritten                  |
| Local storage                      | `darkforest-assist-v1`              | Assist intent, engagement policy, and selected destination               | Until cleared or overwritten                  |
| Local storage                      | `darkforest-accessibility-v1`       | Text scale, motion, contrast, violence, particles, and audio preferences | Until cleared or overwritten                  |
| Session storage                    | `darkforest-echo-jit-v1`            | Bounded match identifiers used to avoid repeating a local guide prompt   | Until the tab session ends                    |

These values remain in the browser and the public demo sends no analytics or login credentials. The
demo must not require or persist a production bearer token, password, private key, or live session
identifier. Browser storage belongs to the person running the demo and can normally be cleared
through browser site-data controls.

A fork that adds accounts, cross-device identity, telemetry, crash reporting, payments, or
production sessions must document and implement its own lawful privacy and security design.

## Fixtures and logs

Fixtures are synthetic and must not contain names, email addresses, IP addresses, account IDs, live
chat, device identifiers, production replays, or other personal/production data. Local development
logs should avoid full URLs containing secrets and should not log browser-storage contents or
message payloads unnecessarily.

The mock server is not a data-collection service and should not be exposed to the Internet.

## Contributions

GitHub records account and contribution metadata under GitHub's policies. Do not put personal data,
private correspondence, security reports, logs from real players, or secrets into issues, pull
requests, fixtures, screenshots, or commits. Use the private channel in
[SECURITY.md](../SECURITY.md) for a vulnerability.

## Official game and third-party deployments

The official game at `darkforest.tw` and third-party deployments are separate services with their
own operator, code, data practices, and legal obligations. This document does not describe or
override their privacy notices.

Operators integrating this client with a network service are responsible for data minimization,
notices and consent where required, retention/deletion, user rights, cross-border transfer, vendor
review, account security, incident response, and applicable law.
