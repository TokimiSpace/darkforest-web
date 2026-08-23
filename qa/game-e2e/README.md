# Darkforest public-demo browser QA

This directory is an isolated Node test island for the open-source browser client. It uses exact
versions of `@playwright/test@1.62.1` and `@axe-core/playwright@4.12.1`; neither dependency enters
the Deno/Fresh runtime graph.

## Install and run

From this directory:

```sh
npm ci --ignore-scripts --omit=optional
npm audit --audit-level=high
npm test
```

The default local run reuses the installed stable Chrome. CI, or `DARKFOREST_QA_BROWSER=chromium`,
selects Playwright Chromium instead; install that binary with `npm run install:browser` when needed.

The suite starts only these endpoints:

- public web client: `http://127.0.0.1:8000`
- deterministic fixture server: `http://127.0.0.1:8788`

Any request or WebSocket outside those loopback origins is blocked and fails the test. The suite
does not cover an authoritative game service or any company operations surface.

## Coverage

- all twelve declared local fixtures and the core lobby-to-gameplay human journey;
- combat preview/action, echo policy, local shop confirmation, and terminal state;
- six locales: `zh-TW`, `zh-CN`, `en`, `ja`, `ko`, and `vi`;
- critical axe violations (`0` required) and reduced-motion behavior;
- desktop 1440×900 and 1366×768, portrait 390×844 and 360×800, and landscape 844×390 and 667×375;
- horizontal overflow, primary controls, uncaught exceptions, console errors, unexpected sockets,
  external requests, disallowed asset families, and browser credential persistence.

The HTML report is written under `output/`; screenshots, traces, and video are retained only on
failure. The whole directory is ignored by Git.
