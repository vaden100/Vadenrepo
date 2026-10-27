# Redirect map (old site to new site)

SPEC 4.6 and 13: every old URL returns a 301 to the right new page, or a deliberate 410.

Only the home page of the current Square site has been seen (the crawl is blocked by the build
environment's network policy, see `discovery/README.md`). This map is incomplete until the crawl
runs; the new site lives on a new host, so no redirects are active yet.

| Old URL (thenonsocialonegallery.square.site) | New URL   | Status        | Notes                                                                  |
| -------------------------------------------- | --------- | ------------- | ---------------------------------------------------------------------- |
| `/`                                          | `/`       | 200           | Same path                                                              |
| `/shop`, `/s/...` and other Square pages     | to decide | pending crawl | The header shows a cart; the shop's future is placeholders question 10 |

When the crawl runs: add every crawled URL here, then add the redirects to `next.config.ts`
(`redirects()`), and the Phase 2 acceptance test that checks each one.
