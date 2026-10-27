# Operations

## Environment variables

| Name       | Where            | Used by                      | Notes                                                                  |
| ---------- | ---------------- | ---------------------------- | ---------------------------------------------------------------------- |
| `SITE_URL` | hosting settings | canonical URLs, social cards | e.g. `https://ns1gallery.example`; defaults to `http://localhost:3000` |

Server-only secrets never use a `NEXT_PUBLIC_` prefix.

## Third-party inventory

None. Fonts are self-hosted from npm (`@fontsource-variable/atkinson-hyperlegible-next`,
`@fontsource-variable/fraunces`, SIL Open Font License 1.1). The page makes no request to any other
host (tested in `e2e/foundations.spec.ts`).

When one is added: CSP (`apps/web/lib/security/headers.ts`), `/legal/subprocessors`, consent
category and this table, in the same change.

## Security headers

Set per request in `apps/web/proxy.ts`: nonce CSP (`script-src 'nonce-...' 'strict-dynamic'`, no
`unsafe-inline` or `unsafe-eval` in production, styles by nonce), HSTS in production,
`X-Content-Type-Options`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`,
`Referrer-Policy: strict-origin-when-cross-origin`, Permissions-Policy with camera, microphone and
geolocation off.

## Tests

- `pnpm check`: lint, format, typecheck, unit tests (tokens contrast in four themes, i18n,
  ui, CSP, reading settings, copy rules, brand pipeline and logo swap), brand check, copy check,
  readability.
- Browser suite (`pnpm test:e2e` after `pnpm build`): axe with WCAG 2.2 AA and AAA text contrast on
  every page in light, dark, high contrast light and dark, forced colors, and with every reading
  setting on; console errors; 320 px overflow; skip link; reading settings by keyboard;
  security headers; no third-party requests; favicon and social images.
