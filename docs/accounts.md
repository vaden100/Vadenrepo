# Accounts

Every account is created **by the organization, in its own name**, with an organization email
(SPEC 17.1). The builder works through invitations or tokens the organization creates and sets as
environment variables. Never paste a password, key or token into a chat.

Sign-in protection: **must** have passkeys or 2FA: domain registrar, Cloudflare, main email,
GitHub, Supabase, donation platform, the site's admin console. **Recommended** for the rest.
At least two people from the organization are admins on every critical account.

| Service           | Purpose                                | Owner email    | Admins (2+)    | Sign-in protection | Env vars it provides                                             | Status                                                                                                                      |
| ----------------- | -------------------------------------- | -------------- | -------------- | ------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| GitHub            | Code, CI                               | [needs source] | [needs source] | must               | none                                                             | Repository `nonsocialone-site` to be created by the owner; code waits on branch `nonsocialone-site` of `vaden100/vadenrepo` |
| Domain registrar  | Domain name                            | [needs source] |                | must               | none                                                             | No domain known yet (placeholders question 15)                                                                              |
| Cloudflare        | Hosting, DNS, R2, Turnstile, analytics |                |                | must               | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (CI deploy)      | Not created                                                                                                                 |
| Square            | Current website and shop               | [needs source] |                | must               | none                                                             | Existing; keep until launch                                                                                                 |
| Supabase          | Database, staff sign-in                |                |                | must               | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Phase 4                                                                                                                     |
| Donation platform | Gifts                                  |                |                | must               | none                                                             | Only if nonprofit status is confirmed                                                                                       |
| Resend            | Email sending                          |                |                | recommended        | `RESEND_API_KEY`                                                 | Phase 4                                                                                                                     |
| Sanity            | Content editing                        |                |                | recommended        | `SANITY_PROJECT_ID`, `SANITY_API_TOKEN`                          | Phase 2                                                                                                                     |
| Sentry            | Errors                                 |                |                | recommended        | `SENTRY_DSN`                                                     | Phase 8                                                                                                                     |
| UptimeRobot       | Uptime                                 |                |                | recommended        | none                                                             | Phase 8                                                                                                                     |

## Removing the builder's access

For each service: remove the builder's invitation or user, rotate any token the builder set up,
and confirm two organization admins remain.
