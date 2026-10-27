# Discovery (Phase 0)

Date: 2026-10-27. Facts and sources: `facts.md`. Open questions: `placeholders.md`.

## How this was gathered, and what is missing

- The build environment could not reach the site: the shell's network policy denied
  `thenonsocialonegallery.square.site`, and the web fetch tool could not resolve any host (it failed
  on `linktr.ee` too), so this is an environment limit, not a problem with the site.
- Discovery is therefore based on the home page text the director pasted and a 10-second screen
  recording. **Only the home page is covered.** Pages behind the menu, the shop (the header shows a
  cart and account icon), the booking flow, the Linktree targets and the "Need A Lawyer?" link are
  not yet seen.
- The crawl, `baseline.md` (axe, 320px layout, page weight, broken links, alt text) and the full
  redirect map wait until the host is allowed in the environment's Network access settings.

## Who they are

A community gallery and conversation space in Indianapolis, founded 2022, led by its
owner/creator DaShawn "Dub" Warfield. The core program is **S.A.F.E Sessions**: small roundtables
(10 to 15 people, twice a month) at P30 that use movies, art, music, viral moments and the news to
talk through culture, expression and conflict. Around it sit paid or bookable offers: private
sessions, creative consulting, collaborations, and a lawyer referral.

## Voice

Personal, street-level, confident and warm. Short questions as headings ("S.A.F.E ?!",
"Need A Lawyer ?", "Have You Made It To Any…"), direct address ("Let's talk!", "see for yourself"),
slang and inside references ("Slimeball", "Nonsocial. Not Antisocial."). The new site keeps this
voice in headings and calls to action and uses plain words for facts and forms (SPEC 6.1).

Terms to confirm with the community: what S.A.F.E stands for (if anything), what "Slimeball" is,
and how participants like to be called (guests, members, the community).

## Pages seen

| Page                        | Job today                                                  | Notes                                            |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| Home                        | Explains the gallery, sells S.A.F.E Sessions, lists offers | Everything is on one page                        |
| Menu, search, account, cart | Square defaults                                            | Contents unknown                                 |
| "Text us"                   | Square text widget, floating                               | Covers content on small screens in the recording |

## What works

- A clear signature program with a strong, memorable name and a real format (size, rhythm, place).
- Real photos and video of real sessions: authentic, no stock.
- A distinct voice and tagline.

## What is missing or weak

- **No legal or tax information at all**: no legal name, EIN, nonprofit status, board, financials.
  The build spec is for a nonprofit; whether NS1 is one decides the Give and Trust modules.
- No session dates. "Catch the upcoming Session" has no date, time or sign-up.
- No email, phone or mailing address; contact only through a text widget and a Linktree.
- Booking, consulting, collab and lawyer offers all say "let's talk" with no form or next step.
- "Need A Lawyer?" is a sensitive offer with no explanation of who the "2 reps" are, what it
  costs, or any disclaimer. It needs counsel before it appears on the new site.
- Mental health is named in the mission, but the site has no crisis resources.
- Square loads its own scripts and a store on a content site; the header cart suggests a shop
  that is not visible on the home page.
- Typography: italic centered body text and inconsistent quote marks (`" The NS1 Gallery "`).
- Accessibility and speed are unmeasured (baseline blocked).

## Flows today

| Flow                 | Today                                                      |
| -------------------- | ---------------------------------------------------------- |
| Donations            | None seen                                                  |
| Event sign-up        | None seen; "Catch the upcoming Session" with no link       |
| Volunteers           | None seen                                                  |
| Booking and services | "Tap the link for more information" (destination not seen) |
| Shop                 | Cart icon present; products not seen                       |

## Legal and transparency pages

None seen. Privacy, terms, accessibility: not seen.

## Brand inventory (from the recording)

- Logo: hand-drawn "NS1" mark, black on white, raster. No vector file seen: the spec's
  temporary wordmark rule applies until a vector exists (SPEC 6.6).
- Second mark: "S★S", S.O.S, "Stack Over Shine" (confirmed by the director), with a red star as the O, used as a video watermark.
- Colors seen: black, white, a red accent (star, whiteboard drawings). No brand guide seen.
- Fonts: Square defaults (sans-serif, italic body).
- Photography: real session photos and video. Consent and rights: question for the director.

## Domain and email

The site is on a Square subdomain; no custom domain or organization email was seen. Nothing to
migrate yet; `launch-plan.md` will cover buying or connecting a domain and setting up email
without breaking anything once the director confirms what exists.

## Proposed module decisions (draft, final after the director answers placeholders)

| Module               | Draft decision                                                        | Reason                                                                                                               |
| -------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Programs             | On                                                                    | S.A.F.E Sessions and the offers                                                                                      |
| Events               | **On**                                                                | Sessions twice a month with 10 to 15 seats: RSVP with capacity fits exactly                                          |
| Stories              | On                                                                    | Required; only with consent                                                                                          |
| Contact              | On                                                                    | Required; replaces the text-only contact                                                                             |
| Give                 | On **only if** NS1 is a registered nonprofit or has a fiscal sponsor  | The spec forbids implying tax-deductible giving without a source                                                     |
| Trust / transparency | Same condition as Give; otherwise a shorter "About and policies" page | No legal facts exist yet                                                                                             |
| Partners             | On, renamed around "Book a session / Collab"                          | The booking and collab offers match the partner builder pattern                                                      |
| Get help             | Off as a request form; **crisis resources on**                        | S.A.F.E Sessions are not crisis services, but the mission names mental health, so 988 and local resources are listed |
| "Need A Lawyer?"     | Held until counsel reviews it                                         | Legal referral needs disclaimers and clarity on who provides it                                                      |
| Volunteer            | Off until confirmed                                                   | Not seen on the site                                                                                                 |
| Newsletter           | On (double opt-in)                                                    | Sessions recur; people need dates                                                                                    |
| Languages            | English only until confirmed                                          | No other language seen                                                                                               |
