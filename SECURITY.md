# Security policy

Darkforest Web is pre-alpha frontend and local-demo software. It is not the production Darkforest
service and does not include the private match server, authoritative game core, accounts, databases,
or live-operations infrastructure.

## Reporting a vulnerability

Please report repository vulnerabilities privately through
[GitHub Security Advisories](https://github.com/TokimiSpace/darkforest-web/security/advisories/new).
If that channel is unavailable, contact `ben@tokimi.space` with the subject
`darkforest-web security`.

Include, when safe:

- affected commit, file, and browser/runtime version;
- impact and preconditions;
- minimal reproduction against the local demo;
- suggested mitigation, if known;
- whether you believe credentials or personal data were exposed.

Do not open a public issue for an unpatched vulnerability. Do not include secrets, live tokens,
personal data, or production replay data in a report.

Maintainers will try to acknowledge a complete report within seven days, but this is a volunteer
pre-alpha project and no response or remediation SLA is promised. Credit is offered when desired and
safe after a fix is available.

## Authorized testing boundary

You may test code you run locally with the bundled loopback fixture server. This policy does **not**
authorize testing, scanning, traffic generation, account access, or exploitation against
`darkforest.tw`, Tokimi infrastructure, another person's deployment, or any third-party service.
Obtain explicit permission from the relevant operator first.

## Supported versions

Until the first tagged release, only the current default branch may receive security fixes. After
releases begin, the support table will be maintained here. Forks and modified deployments are
maintained by their operators.

## Security assumptions

- The bundled mock binds to loopback and is for development only.
- The local demo does not require a production account or bearer token.
- A fixture is untrusted input; browser and server code must validate it before unsafe use.
- Client-side checks are UX aids, never authoritative authorization or anti-cheat controls.
- Production integration requires an independently reviewed authentication/session design, strict
  origin policy, Content Security Policy, transport security, rate limiting, and server-side
  validation.
- No `.env`, private key, production endpoint secret, database URL, or live token belongs in source
  or test fixtures.

Security-related changes should include regression tests and should preserve the explicit
public/private boundary in [docs/PUBLIC_SCOPE.md](docs/PUBLIC_SCOPE.md).
