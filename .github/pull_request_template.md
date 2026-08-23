## What changed

Describe the public-client change and its user-visible effect.

## Public-release checklist

- [ ] No game core, match server, operations/admin code, private paths, credentials, or production
      endpoint defaults were added.
- [ ] New or changed static assets are listed in `apps/web/static/assets-manifest.json` with an
      approved status, license, provenance, and SHA-256.
- [ ] The local mock still binds only to `127.0.0.1` and does not allow wildcard CORS.
- [ ] `deno task ci`, publication checks, and dependency audits pass with the frozen lockfile.
- [ ] User-facing changes were checked in both English and Traditional Chinese where applicable.
