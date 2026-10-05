# Brand assets

SPEC.md section 13 lists these files as provided by Vaden World. The final artwork was
not in the repo when Phase 0 was built, so every file here except `icons/` is a
**placeholder** with the right filename, size, colors and outlined lettering (each file
has a `PLACEHOLDER` comment). Drop the real files in with the same names and run:

```sh
pnpm brand:sync
```

That copies the SVGs into the web app (`apps/web/public/brand`) and regenerates the
icon module used by `@rmmm/ui` on web and mobile.

## Rules

- Icons: 24 px grid, 2 px stroke, square caps, `stroke="currentColor"`. Do not swap in a
  stock icon library.
- The wordmark is outlined artwork. Never re-type it as live text.
- `app-icon.svg` is 1024 x 1024. EAS exports the iOS/Android sizes (Phase 7).
- All lettering is from SIL OFL fonts (Archivo Black, IBM Plex Mono).
