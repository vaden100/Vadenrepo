# RUN ME MY MONEY

App and website for the Vaden World documentary series about scams and shady small
businesses: look a business up before you pay, submit your story with receipts, follow
the cases, watch the episodes.

- **Spec:** [SPEC.md](SPEC.md)
- **Working notes for contributors and Claude Code:** [CLAUDE.md](CLAUDE.md)

```sh
corepack enable
pnpm install
pnpm dev:web      # then open http://localhost:3000/styleguide
pnpm dev:mobile
pnpm check && pnpm build
```

Copy `.env.example` (and `apps/*/.env.example`) to local env files. Never commit secrets.
