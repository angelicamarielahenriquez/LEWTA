# LEWTA V10 — what changed (October 2026)

## 1. Organization
- The 107 original images are now in clear folders with descriptive names (`public/images/aliens/`, `accessories/`, `cities/`, `stamps/`, `missions/`, `navigation/`, `games/`, `rewards/`, `backgrounds/`, `branding/`). Nothing was redrawn. The small XP, gem and streak icons were cut from your own banners (118, 119, 120).
- The 19 audio files are in `public/audio/cities/`, `games/` and `effects/`.
- The 960-line `app/page.tsx` was split into screens (`components/`) and rules (`lib/`).
- Unused old files (an older match game, old question banks) were removed from the project and kept in the backup ZIP.
- Excel files and the V10 prototype are in `reference/` (not public on the website).

## 2. Questions (your Excel)
- All 960 sentences were rewritten in short, natural TOEIC-style English, based on your workbook. Every sentence contains the target word exactly once and gives no clue to the answer.
- Fixed in your Excel: 33 sentences that showed the target word, 22 that showed the answer, 12 with the word twice (7 of these would have put the blank in the wrong place), 172 sentences of 25+ words, 36 near-duplicates, and heavy repetition of templates.
- 7 answers that contained a slash (for example "seller / supplier") now have one clear answer. 15 Spanish translations were corrected (for example *advise* = aconsejar, not advertir; *conduct a study* = realizar, not conducir; *wholesale* = vender al por mayor).
- Some pairs moved to a different position so that no round contains two words with the same meaning (before, 24 rounds could mark a correct match as wrong) and so Context Match only asks students to type answers of one or two words.
- The game never shows another correct synonym as a "wrong" option (this affected 289 words with more than one synonym in the same world).
- Everything is documented in `reference/content/LEWTA_Corrected_Question_Bank_V10.xlsx` (Change Log and Validation sheets). The 960 pairs and their IDs are preserved.

## 3. Progress, aliens and rewards (bugs fixed)
- **Aliens and rewards are repaired automatically**: when a student opens LEWTA, any alien, destination or city reward that their completed missions prove they earned is restored (no extra XP or gems). The student sees a "we restored…" message.
- **No more lost progress between devices**: every save merges with the cloud copy first.
- **"Reset local progress" no longer touches the cloud** for accounts. Accounts get "Reload from my account" instead.
- Streak now restarts at 1 after a missed day (before, it never went down).
- Replayed missions show the real XP earned (20%), not the full amount.
- A mission can no longer be rewarded twice if the timer ends at the same moment as the last answer.
- The last correct answer of a round is no longer lost from Words to Revisit statistics.
- The "City reward" shown in the passport now matches the reward really given.
- Reward amounts, unlock order and mission rules are the original ones.

## 4. V10 design
- Original welcome picture with clickable TPT, YouTube, Start and Comments areas, music button, and the three entry choices.
- Dark space style for every screen, new Learning Hub, city page with city icons, passport with stamps, stamp collection, profile with "About me", pending words, gem shop with all 26 accessory images (purple headphones included), aliens with locked silhouettes, How to Play with mission artwork, Teacher Dashboard with city icons and visitor comments.
- Phone menu at the bottom; tested at phone and desktop sizes with no sideways scrolling.

## 5. Games
- All five games keep their original mechanics, timers, hints and scoring.
- Review Rush now uses your Review Rush background and music; words fall like meteors, can be paused, and the correct synonym lands on the student's alien.
- Sound: volume slider and mute button (remembered on the device); city music in cities, Review Rush music in Review Rush.

## 6. Accounts
- "Continue with Google" button added (needs Google switched on in Supabase — see `docs/SUPABASE_SETUP_GUIDE.md`).
- No database tables or security rules were changed. Two optional SQL files are included but NOT applied.

## Accessories (new catalog, original rules)
Original item IDs were kept so students keep what they own. Items without a picture now use your artwork: Festival Pin → Mexican Hat, Neon Visor → Money Bag, Orchid Pin → Orchid Flower, Island Headphones → Jamaican Maracas, Flamenco Flower → Flamenco Shoe, Magic Hat → Magic Wand, Space Headphones → Purple Headphones. New items from your images (Golden Frog, Sancocho, Paris Beret, Moustache and 9 face stickers) were added to cities, buyable with gems.

## Review Rush and Teacher Mode (October 28)

- **Review Rush:** the play area is transparent so the original space background shows. Meteors really fall: their
  positions live in the game state and move with a game loop (`lib/reviewRush.ts`). Destroy the 3 wrong meteors before
  they land; the correct synonym must reach the ground. Clicking the correct synonym or letting a wrong meteor land costs
  one of 3 lives. 10 words per game, real score, Game Over screen with Try Again. Pause freezes meteors and timer; Reset
  restores everything. Works with mouse, touch and keyboard. Time limit for the whole game is now 3:00.
- **Teacher Mode:** no shared password any more. The server checks the signed-in Supabase account on every request
  (`lib/server/teacherAccess.ts`): it must have a verified e-mail listed in `TEACHER_EMAILS`, or `profiles.role = 'teacher'`.
  The teacher gets all 12 cities, all 60 missions, every alien, accessory and stamp for inspection, and nothing she does
  is saved. Students and guests cannot open the dashboard, and the class-data API refuses them.
- **Teacher Dashboard:** each student's cities and missions, accuracy, XP, gems, streak, rewards, words to revisit and
  game results — only data that is actually stored.
