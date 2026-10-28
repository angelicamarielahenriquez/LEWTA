# Publishing LEWTA V10 — step by step

Nothing here touches your live site until the very last step.

## 1. Test on your computer first
1. Unzip the project into a NEW folder (for example `Downloads\LEWTA_V10`). Do not overwrite your old folder.
2. Copy your existing `.env.local` from your old LEWTA folder into the new folder (it is not inside the ZIP on purpose).
3. Open CMD in the new folder and run `npm.cmd install`, then `npm.cmd run check`, then `npm.cmd run build`, then `npm.cmd run dev`.
4. Open http://localhost:3000 and try: Guest mode, logging in with a test account, one mission, Profile, Passport.

## 2. Put it on GitHub (new repository)
1. On github.com → **New repository** → name it (for example `lewta-v10`) → **Private** → Create.
2. Easiest way without commands: install **GitHub Desktop** → File → Add local repository → choose the new folder → it will offer to create the repository → Publish. GitHub Desktop respects `.gitignore`, so `.env.local`, `node_modules` and `.next` are NOT uploaded.
3. Check on github.com that you see the folders `app`, `components`, `lib`, `data`, `public`, and that there is **no** `.env.local`.

## 3. Create a Vercel Preview (safe test link)
Option A — keep your current Vercel project and live address:
1. Vercel → your LEWTA project → **Settings → Git** → **Connect Git Repository** → choose the new GitHub repository.
2. Vercel builds a **Preview** for each new commit. Check that **Environment Variables** contain the same values as your `.env.local` (and the three server-only teacher/Supabase secrets).
3. Open the Preview link and test.

Option B — a separate test project first: Vercel → **Add New → Project** → import the new repository → add the environment variables → Deploy. This gives a separate test address and does not change the live site.

## 4. Go live (only after you approve the preview)
- In Vercel → **Deployments** → choose the tested preview → **Promote to Production**.
- If anything goes wrong, Vercel → Deployments → choose the previous production deployment → **Promote** (instant rollback).

## 5. After going live
- In Supabase → Authentication → URL Configuration, confirm your live address is allowed.
- Optional: turn on Google sign-in (`docs/SUPABASE_SETUP_GUIDE.md`, section 7).
