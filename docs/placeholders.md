# Open questions

Plain questions only the organization can answer. Grouped by who answers. Each answer goes into
`facts.md` as "confirmed by {name} on {date}".

## For Dub (director / owner)

**These two decide the shape of the whole site; please answer first:**

1. **Is The NS1 Gallery a registered nonprofit?** If yes: legal name, EIN, and is it a 501(c)(3)?
   If no: is it an LLC or sole proprietorship, and do you plan to apply, or use a fiscal sponsor?
   (The build spec is for a nonprofit. Without nonprofit status the site will not ask for
   "donations" or say "tax-deductible".)
2. **What should the site's main action be?** For example "RSVP for the next S.A.F.E Session",
   "Book a session", or "Give".

Then:

3. What does S.A.F.E stand for, if anything?
4. What is "Slimeball" (in "personalize it to your Culture featuring Slimeball")?
5. What is P30: your space or a partner venue? Can we name it and show the address?
6. When is the next S.A.F.E Session? Fixed days (for example every 1st and 3rd Thursday) or set each time?
7. Do sessions cost anything? Do guests need to sign up, and is there an age limit?
8. Who are the "2 reps" for "Need A Lawyer?" Are they licensed attorneys, a firm, or a referral
   service? Is it free? (Counsel must review this before it goes on the new site.)
9. Are Creative Consulting, Personal Collab and Book a Session paid? Prices, or "ask for a quote"?
10. What is in the Square shop (cart icon)? Keep selling it, and through Square?
11. Public email, phone number, and a mailing address (if any) for the site.
12. Social accounts to link (Instagram, TikTok, YouTube...). What is on the Linktree today?
13. Can we name you on the site as "DaShawn 'Dub' Warfield, Owner/Creator"? Anyone else to list?
14. Do you have the logo as a vector file (SVG, AI, PDF)? Brand colors or fonts?
15. Do you own a domain name (for example ns1gallery.com)? Where is email hosted today?
16. Any numbers you can source: sessions held, people attended, since when, how counted?

## Consent (for Dub)

17. The photos and videos show identifiable people. Do you have their permission to use them on
    the website? In writing? For how long?
18. Who filmed the videos and took the photos? Do you have the rights?

## For counsel

19. "Need A Lawyer?" wording and disclaimer.
20. Privacy policy, terms, accessibility statement (drafts will be marked pending counsel).
21. If donations: state charitable solicitation disclosure for Indiana.

## For the build environment owner (you)

22. Allow `thenonsocialonegallery.square.site` (and probably `*.square.site`, `*.squarecdn.com`,
    `*.editmysite.com`, `linktr.ee`) under Network access in the environment settings, so the
    crawl, baseline audit and redirect map can run.
23. Create the GitHub repository `nonsocialone-site` and give the Claude GitHub App access. Until
    then the code lives on branch `nonsocialone-site` of `vaden100/vadenrepo`.

## Owed before launch (not questions)

- Vector logo (see `docs/logo-swap.md`).
- Community review of the shape primitives (SPEC 7.2).
- Crawl, baseline audit and redirect map of the current site (needs network access).

## Placeholders that will show on the site until answered

- `[LEGAL NAME: needs source]`, `[EIN: needs source]`
- `[NEXT SESSION DATE: needs source]`
- `[IMPACT FIGURE: needs source]`
- `[CONTACT EMAIL: needs source]`
- Temporary "NS1" wordmark until the vector logo arrives
