# LEWTA — Learning English with Teacher Angélica (V10)

An English-vocabulary game for EFL/TOEIC students: 12 destinations, 5 games per destination, 960 synonym pairs, aliens, accessories, passport stamps, and a Teacher Dashboard.

- **Built with:** Next.js, React, TypeScript, Supabase (accounts and cloud progress).
- **Play modes:** student accounts (email or Google) with cloud progress, or Guest mode (saved on one device).

## Quick start
```
npm install
npm run check   # types, code quality and automatic tests
npm run dev     # http://localhost:3000
```
Copy `.env.example` to `.env.local` and fill in your Supabase values (see `docs/SUPABASE_SETUP_GUIDE.md`).

## Guides
- `PROJECT_STRUCTURE.md` — where everything is and how to change it.
- `CHANGES_V10.md` — what changed in this version.
- `docs/DEPLOY_GUIDE.md` — GitHub and Vercel, step by step.
- `docs/SUPABASE_SETUP_GUIDE.md` — database, accounts, Google sign-in.
