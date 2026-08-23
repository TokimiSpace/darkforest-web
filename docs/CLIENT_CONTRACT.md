# Public-demo client schema

## Status

`packages/protocol` defines the standalone local demo's browser message schema. It exports
`PROTOCOL_VERSION = 1`. This version belongs only to this public repository; it is intentionally
independent from, and does not claim compatibility with, Tokimi's production service.

The package contains the structures, units, runtime parser, and sanitized identifiers used by the
included browser and committed fixture flow. It also contains a small set of synthetic,
client-side-only presentation shapes described below. Production contracts, server helpers,
databases, matchmaking, and resolution logic are excluded.

## What it guarantees

For one repository revision, the package is the source of truth for:

- public-demo identifiers and browser state shapes;
- client commands and server message envelopes exercised by the local fixture flow;
- explicitly presentation-only shapes used to render synthetic client concepts;
- public-demo phases, status values, items, actions, errors, and event payloads;
- units documented by the types, including basis points and game milliseconds;
- the exported public-demo protocol version.

The browser and fixtures use the same definitions and runtime boundary. Every committed fixture
welcome/diff is checked against the same structural validator in unit tests.

## Presentation-only shapes

The browser retains synthetic queue, lobby, and spectator-waiting states so contributors can inspect
those frontend concepts. The committed fixture server does not emit or operate those states. They do
not implement matchmaking, accounts, sessions, admission, a spectator service, or an official
service contract, and downstream code must not infer any production compatibility from them.

## What it does not guarantee

The schema does not define or promise:

- compatibility with an official or historical production protocol;
- authoritative command legality, outcomes, randomness, or balance;
- matchmaking, persistence, identity, moderation, anti-cheat, or abuse prevention;
- production availability, latency, rate limits, or support;
- that fixture transitions reproduce private service algorithms;
- compatibility across every pre-alpha release.

Client-side acceptance never proves authorization. A downstream service needs its own complete
schema validation, authorization, state machine, and security review.

## Runtime boundary

`packages/protocol/src/runtime.js` parses every public-demo WebSocket frame before it enters the UI.
It rejects unknown envelopes, incompatible public-demo versions, non-finite numbers, dangerous
object keys, excessive depth/size, malformed required snapshots/diffs, unsafe identifiers, and
invalid local topology references. It also neutralizes HTML syntax in all inbound strings before
rendering.

This is a bounded structural parser for the included demo—not a complete semantic validator. It does
not prove every event invariant, validate an official session, authorize commands, or replace output
escaping and safe DOM APIs. Treat parser expansion and message-shape changes as security-sensitive.

## Compatibility rules

Prefer additive changes where an older public-demo client can safely ignore a field. A breaking
change must increment `PROTOCOL_VERSION`, update the browser runtime and all fixtures, add tests,
and record the change in `CHANGELOG.md`.

## Local endpoint

The default connection is:

```text
ws://127.0.0.1:8788/ws?fixture=openingMegaCity
```

The fixture selector accepts only committed scenario names. The mock binds to loopback and restricts
origins. It must not accept arbitrary paths, credentials, or unauthenticated Internet traffic.

A fork that designs a separate network service must make connectivity explicit, revise the CSP, and
perform its own privacy and security review. Never add an official host as a fallback.

See [Public scope](PUBLIC_SCOPE.md), [Security policy](../SECURITY.md), and
[Licensing](../LICENSES.md).
