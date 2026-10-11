# Open data and the reels (research, 2026-10-11)

Two things were reviewed before Phase 4 (deep search):

1. A reel walking through decompiled Duolingo Android code (`com/duolingo/data/*`).
2. The `public-apis/public-apis` list on GitHub, plus government open data that can help
   someone check a business before they pay.

Network note: the build container's egress policy blocks government and abuse.ch hosts, so
nothing below was called live from here. Facts come from search results and the providers'
own documentation as quoted in them. Anything marked **verify** must be checked before it
ships.

## 1. What the Duolingo reel shows, and what RUN ME MY MONEY takes from it

The reel shows code from the decompiled Android app. We cannot verify it and we do not copy
proprietary code. These are the patterns it claims to show:

| Pattern in the reel                                                                                             | What it does                                              | Decision for RMMM                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data/churn`: `latest_tomorrow_prob`, `previous_tomorrow_prob`                                                  | A model predicts whether you come back tomorrow           | **Not used.** We do not optimise people who just lost money for return visits.                                                                                                                                                                                 |
| `entry_point`: shortcut, widget, notification, launcher                                                         | Records how the app was opened                            | **Taken, privacy-safe.** Lookups record a coarse source (`home`, `lookup`, `report`, `share`, `app`) in consent-gated analytics only. It tells us whether the share cards work.                                                                                |
| `session_end`: `num_sessions_completed_today`, `num_challenges_incorrect`                                       | Engagement counters                                       | **Not used.**                                                                                                                                                                                                                                                  |
| `app_open`: `crashed_since_last_open`                                                                           | Crash attribution                                         | **Taken.** Already covered by error reporting (`/api/client-errors`, no personal data).                                                                                                                                                                        |
| Wi-Fi reminder worker, `TriggerType.WIFI`                                                                       | Sends a reminder when you join Wi-Fi                      | **Not used.**                                                                                                                                                                                                                                                  |
| Network fingerprint: SHA-256 of `gw` + `dns` + `net`; `firstSeenEpochDay`, `daysSeen`                           | Recognises which networks (home, work) you use            | **Refused.** A gateway/DNS fingerprint can reveal where a reporter lives or works. Victims may be reporting someone close to them (SPEC 1, 11). Our only device signal is a random per-install id, hashed, used for bans.                                      |
| `ringer_mode`: silent, normal, vibrate                                                                          | Tracks phone settings around notifications                | **Refused.** Not needed, and it is the kind of signal that ends up in a data broker profile.                                                                                                                                                                   |
| Notification reasons rotated: `FRIEND_STREAK`, `STREAK_FREEZE`, `STREAK_EXTENDED`, `LEADERBOARD`, `(i + 1) % 4` | Cycles the reason in "turn notifications back on" prompts | **Partly taken (Phase 6).** When we ask people to allow notifications, the reason is concrete and true: "a page you watch got a new report", "your case changed status". There are no streaks or leaderboards; there is nothing to gamify about being scammed. |

Rule we keep from this: every signal we collect has to be explainable on the privacy page in one
plain sentence, and none can identify a place or a person.

## 2. Open data that helps "look them up before you pay"

Ranked by how useful they are for the lookup and how safe they are to use.

| Source                                                               | What it gives                                                                              | Access                                     | Status / license                                                                                                                      | Use in RMMM                                                                                                                                       |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RDAP** (IANA bootstrap, `rdap.org`)                                | Domain registration date ("this site is 3 weeks old")                                      | Free, no key                               | Standard protocol (RFC 9224). Some registries rate-limit.                                                                             | **Phase 4.5:** "Website registered on {date}" next to a domain identifier. One of the strongest new-page signals in the Before You Pay checklist. |
| **FTC Do Not Call reported calls** (`api.ftc.gov/v0/dnc-complaints`) | Numbers people reported for unwanted calls, by date                                        | Free api.data.gov key                      | Unverified consumer reports. Filters: date range, state, area code, robocall. **No phone-number filter**, so it needs a daily import. | Later: count of FTC reports for a phone identifier, labelled "unverified consumer reports to the FTC".                                            |
| **FCC consumer complaints** (`opendata.fcc.gov`, Socrata)            | Complaints with a "Caller ID Number" field, updated nightly                                | Free; app token raises limits              | Unverified. Dataset id `3xyp-aqkj` comes from a third-party library: **verify**.                                                      | Same as FTC: a neutral count next to phone identifiers.                                                                                           |
| **CFPB Consumer Complaint Database**                                 | Complaints about financial companies, including debt and credit management                 | Free, no key                               | CC0 per one directory, but data.gov lists other terms: **verify**. Only covers companies the CFPB supervises.                         | Credit repair category: link to the company's CFPB complaints when the name matches a registered company.                                         |
| **CFTC RED list**                                                    | Foreign firms soliciting US residents without registration (forex, binary options, crypto) | Web pages only; no API found               | Public. Scraping permission unclear: **verify**.                                                                                      | Forex / trading category: a "Check the CFTC RED list" link on results now, a match later if a feed exists.                                        |
| **URLhaus** (abuse.ch)                                               | Known malicious URLs and hosts                                                             | Free Auth-Key, required since 30 June 2025 | Commercial terms not found: **verify**.                                                                                               | Optional worker check on reported website identifiers.                                                                                            |
| **Google Safe Browsing**                                             | Phishing and malware URLs                                                                  | Key                                        | **Non-commercial only.** Commercial use needs Web Risk (Lookup free to 100k calls/month).                                             | Web Risk Lookup if we add URL checks; the series is commercial.                                                                                   |
| **CourtListener** (Free Law Project)                                 | Court opinions and RECAP dockets, searchable by case name                                  | Free token                                 | Free tier cut in May 2026 to 5/min, 50/hr, 125/day.                                                                                   | Staff research tool in the admin console only. Never automatic: a name match is not the same person.                                              |
| public-apis "Anti-Malware" (AbuseIPDB, OTX, VirusTotal, urlscan.io)  | IP, domain and URL reputation                                                              | Keys                                       | Mostly free tiers with commercial limits                                                                                              | Not needed for Phase 4.                                                                                                                           |

Rules for any outside record we show:

- Shown as a neutral fact with its source and date ("12 reports to the FTC since June 2025,
  unverified"). Never added to a score, never used to name or publish an entity.
- Nothing about an entity is public until our two-person review passes; outside records do
  not change that.
- Every provider goes into `/legal/subprocessors`, the CSP and `docs/operations.md` in the same
  change (CLAUDE.md), and its terms are checked first.

## 2b. In use now (2026-10-11)

- **Phishing.Database** (MIT, github.com/Phishing-Database/Phishing.Database): about 386,000
  active phishing hosts, downloaded by the worker (`--import phishing_database`, or daily with
  `OUTSIDE_IMPORT=1`). Website lookups say when the exact host is on the list, with the source,
  the date, the license and a link to report a false positive. Measured: full import 15 s,
  lookup 3 ms. Reachable from the build container because it is hosted on GitHub.
- **FTC aggregate figures** on the home and lookup pages (`apps/web/content/stats.ts`), each
  linked to the FTC document it comes from. Aggregates only, never about a named business.
- Government sources in section 2 stay pending: this environment's network policy denies
  ftc.gov, fcc.gov, cftc.gov, sec.gov and consumerfinance.gov.

## 3. What Phase 4 builds from this now

- Lookup records a coarse `entry_point` (consent-gated analytics only).
- Results for the forex / trading and credit repair categories link to the official CFTC RED list
  and CFPB complaint search.
- The data model leaves room for outside records (source, fetched_at, value) per identifier.
  The importers wait until each source above is verified from a network that can reach it.

Sources: [public-apis](https://github.com/public-apis/public-apis),
[FTC DNC data](https://www.ftc.gov/policy-notices/open-government/data-sets/do-not-call-data),
[FTC developer APIs](https://www.ftc.gov/developer),
[DNC reported calls API (data.gov)](https://catalog.data.gov/dataset/do-not-call-dnc-reported-calls-data-api),
[fcc_complaints library](https://pypi.org/project/fcc_complaints),
[CFTC RED list](https://cftc.gov/redlist),
[CFPB complaint database (data.gov)](https://catalog-dev.data.gov/dataset/consumer-complaint-database),
[URLhaus Auth-Key change (Cortex XSOAR)](https://xsoar.pan.dev/docs/reference/integrations/feed-ur-lhaus),
[Safe Browsing non-commercial change (GMass)](https://www.gmass.co/blog/?p=9020),
[Web Risk](https://cloud.google.com/security/products/web-risk),
[CourtListener API rate limits](https://www.vaquill.ai/blog/how-to-use-courtlistener-api-2026),
[about.rdap.org](https://about.rdap.org/).
