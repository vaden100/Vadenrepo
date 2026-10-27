# Swapping in the real logo

The site uses a **temporary** wordmark: the name set in Fraunces Bold, outlined to paths
(`scripts/make-temp-wordmark.py`). The hand-drawn NS1 mark on the current site is only available
as a raster image, and the spec forbids tracing it by hand and calling it final (SPEC 6.6).

## What to ask the designer for

- SVG with all text outlined (no fonts inside the file).
- A one-color version that uses `currentColor` (or plain black that we convert).
- A light version for dark backgrounds.
- A square mark that still reads at 16 px (favicon).

## Steps (no code changes)

1. Replace the three files in `brand/logo/`, keeping the names:
   - `wordmark.svg`: the full logo, one color.
   - `wordmark-light.svg`: the same for dark backgrounds (white is allowed in this file only).
   - `mark.svg`: the square mark.
2. Run `pnpm brand:sync`. It checks the files (SPEC 7.4: viewBox, no fixed size, no scripts,
   images or external references, colors through `currentColor`), optimizes them and regenerates
   `packages/ui/src/generated/brand.ts`, `apps/web/app/icon.svg` and `apps/web/public/brand/`.
3. Run `pnpm check` and the browser suite. The header, favicon, touch icon and social images
   all read from the generated files, so they change together.
   `scripts/brand.test.mjs` proves this with fixture logos.
4. Look at `/styleguide` in light, dark and high contrast, and at `/opengraph-image`.
5. Remove "vector logo needed" from `docs/placeholders.md` and record the swap in `docs/decisions.md`.
