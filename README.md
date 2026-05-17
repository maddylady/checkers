# CheckMate Arena

A modern, full-featured checkers platform built as a school project at nfactorial. Covers everything from AI opponents and online multiplayer to tournaments, daily challenges, and a coin economy.

**Live:** https://checkers-production-08d2.up.railway.app  
**Repo:** https://github.com/maddylady/checkers

---

## What It Does

### Game Modes

| Mode | Description |
|---|---|
| **vs Bots** | 22 unique AI characters from Chicky (350 ELO) to DeepCheck (2200 ELO) |
| **Tournament** | 4-player single-elimination bracket — enter names, tap each match winner, crown a champion |
| **Gauntlet** | Beat all 22 bots in order without skipping. Progress saved across sessions. |
| **Local 2P** | Pass-and-play on the same device |
| **Online** | Real-time 1v1 via 6-character room codes (Socket.io WebSockets) |
| **Mines Mode** | Hidden mines on the board — land on one and it detonates |
| **Roulette** | Spin each turn: extra move, skip, or play normally |

### AI Opponents

22 characters with genuine ELO ratings (350–2200). Each bot maps to specific minimax depth and randomness so the skill difference is real — Grandma Rose (420 ELO, depth 1, 82% random) plays nothing like DeepCheck (2200 ELO, depth 7, 0% random).

Tiers: 🟢 Beginner (4 bots) · 🟡 Intermediate (8 bots) · 🔴 Expert (10 bots)

### Rules & Settings
- **American** and **Russian** rule variants (Russian: flying kings, backward captures for all pieces)
- Time controls: untimed, 30s/move, 1min/move, 5min blitz, 15min rapid, 30min classical
- Per-move timer expiry: random move or forfeit

### Progression
- **ELO rating** — calculated after every game using the standard Elo formula (K=32 for first 20 games, K=16 after); saved locally and synced to Supabase
- **Coins** — earned from wins (20), draws (10), losses (5), daily challenges, and streaks
- **Skin shop** — buy cosmetic piece styles with coins
- **Daily Challenges** — three daily goals (easy/medium/hard) with bonus coins and streak tracking
- **Badges** — achievement system shown on your profile

### Social
- **Tournament mode** — run a 4-player bracket with friends live; share the champion on TikTok
- **TikTok Challenge** — home screen CTA: post your game, tag @CheckMateArena, enter the giveaway
- **Global Leaderboard** — ranked by ELO, synced via Supabase; shows top players with win rates
- **Profile** — full stats, game history, badges, streak, ELO history

### Learning
- **Tactics & Strategy panel** — 6 accordion lessons (basics, kings, center control, multi-jump tactics, trading, endgame)
- **Post-game replay** — visual board replay with ⏮◀▶⏭ navigation and move-by-move analysis notes highlighting missed captures, exposed pieces, and chain opportunities

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, `'use client'`) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 with dark/light mode |
| Animations | Framer Motion |
| Multiplayer | Socket.io 4 (custom Node.js server) |
| Auth & DB | Supabase (anonymous + Google OAuth, `player_stats` + `game_history` tables) |
| Icons | Lucide React |
| Testing | Vitest |
| Hosting | Railway (auto-deploy from `main`) |

---

## Architecture

```
checkers/
├── app/
│   ├── page.tsx              Home screen, screen router (home/game/tournament), sidebar
│   ├── layout.tsx            Root layout, metadata
│   └── globals.css           Tailwind + dark mode config
├── components/
│   ├── Board.tsx             8×8 board — click handling, move/last-move highlights, mines
│   ├── Piece.tsx             Animated piece (man + king crown)
│   ├── GamePage.tsx          Full game: AI loop, Socket.io, timers, replay, win detection
│   ├── GameControls.tsx      Turn indicator, captured count, clock display
│   ├── WinScreen.tsx         Win/loss modal with board replay viewer and share button
│   ├── ModeSelector.tsx      7-mode selector, 22-bot grid, Gauntlet, pregame settings
│   ├── TournamentPage.tsx    4-player bracket UI with animated champion screen
│   ├── CoachPanel.tsx        Tactics & Strategy accordion (6 lessons)
│   ├── Leaderboard.tsx       ELO-ranked player list
│   ├── DailyChallenges.tsx   Daily goal tracker with streak display
│   ├── SkinShop.tsx          Coin-based cosmetic shop
│   ├── Navbar.tsx            Theme toggle, coins, Google auth, profile menu
│   ├── ProfileModal.tsx      Player stats, game history, badges
│   ├── BadgeUnlockModal.tsx  Achievement notification overlay
│   └── UsernameModal.tsx     First-run name setup
├── lib/
│   ├── game-logic.ts         All rules: moves, captures, promotion, win/draw detection
│   ├── ai.ts                 Minimax + alpha-beta; ELO → depth/randomness mapping
│   ├── storage.ts            localStorage helpers with JSON error handling; ELO calc
│   ├── supabase.ts           Supabase client; auth; player stats + ELO sync; leaderboard
│   ├── gauntlet.ts           Gauntlet progress (localStorage, ordered bot list)
│   ├── badges.ts             Badge definitions and unlock logic
│   ├── challenges.ts         Daily challenge definitions and progress tracking
│   └── skins.ts              Skin pack definitions and purchase state
├── server.js                 Custom server — Next.js + Socket.io on one port
└── package.json
```

---

## Game Logic

`lib/game-logic.ts` is the rules core:

- **`getAllValidMoves(board, player, variant)`** — returns capture-only moves if any exist (mandatory capture), otherwise all non-capture moves; handles both American and Russian variants
- **`getChainCaptures()`** — recursive multi-jump exploration; for Russian variant, pieces can capture backward and kings can slide multiple squares
- **`applyMove(board, move)`** — clones board, removes captured pieces, handles promotion
- **`checkWinCondition()`** — no pieces or no legal moves = loss; 40-move no-capture rule = draw
- **`analyzeGame(moves, boards)`** — replays the game and flags missed captures, exposed pieces, and chain opportunities

### AI (`lib/ai.ts`)

```
ELO 350  → depth 1, randomChance 0.82   (Chicky — nearly random)
ELO 1200 → depth 4, randomChance 0.12   (mid-tier bots)
ELO 2200 → depth 7, randomChance 0.00   (DeepCheck — full search)
```

`paramsFromStrength(strength)` maps 0–100 linearly to depth 1–7 and randomChance 0.82–0. Each bot's `elo` prop flows through `GamePage → getBestMove(board, player, difficulty, botElo)` so every opponent is genuinely distinct.

### ELO Calculation (`lib/storage.ts`)

```ts
K = gamesPlayed < 20 ? 32 : 16
expected = 1 / (1 + 10^((opponentElo - myElo) / 400))
newElo = max(100, round(myElo + K * (actual - expected)))
```

Opponent ELO comes from the bot's `elo` prop for AI games, or 1200 (default) for human games. Results saved locally and synced to Supabase (`player_stats.elo` column).

---

## Getting Started

```bash
git clone https://github.com/maddylady/checkers
cd checkers
npm install
cp .env.example .env.local   # add your Supabase keys
npm run dev
```

Open http://localhost:3000

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Supabase is optional — the app works fully offline using localStorage. Supabase enables the global leaderboard and cross-device stat sync.

### Scripts

```bash
npm run dev      # Development (Next.js + Socket.io on :3000)
npm run build    # Production build
npm start        # Production server
npm test         # Vitest unit tests (24 tests)
npm run lint     # ESLint (0 errors, 0 warnings)
```

---

## Deployment

Hosted on **Railway** with auto-deploy on push to `main`.

`server.js` runs Next.js and Socket.io on the same HTTP server and port — required for Railway's single-port environment. The custom server also handles room state, turn enforcement, and player reconnection for online multiplayer.

> **Vercel note:** Vercel Serverless Functions don't support persistent WebSocket connections. To deploy on Vercel, replace Socket.io with a hosted realtime provider (Supabase Realtime, Ably, Pusher).

### Supabase Schema

Two tables required:

```sql
-- player_stats
create table player_stats (
  user_id uuid primary key,
  username text not null,
  city text,
  wins int default 0,
  losses int default 0,
  draws int default 0,
  games_played int default 0,
  elo int default 1200,
  updated_at timestamptz default now()
);

-- game_history
create table game_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  mode text,
  result text,
  opponent text,
  moves int,
  duration int,
  created_at timestamptz default now()
);
```

---

## Known Limitations

- **Online multiplayer is not fully authoritative.** The server validates turn order but does not re-validate legal moves server-side. A malicious client could theoretically send illegal moves. Acceptable for a demo; a production system would need a server-side board state and move validator.
- **Coins, skins, and badges are local-only.** They live in localStorage and are not synced to Supabase. Clearing browser data resets them.
- **Russian variant chain captures** have a known edge case: when a regular piece reaches the back row mid-chain, it should promote and continue capturing as a king per Russian rules. The current implementation promotes only after the full move resolves, which matches American behavior.

---

## License

MIT

---

*Built for nfactorial school · Next.js · Socket.io · Framer Motion · Supabase*
