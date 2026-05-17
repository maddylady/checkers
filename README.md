# CheckMate Arena

**A modern, feature-complete checkers platform — 22 unique AI opponents, real-time online multiplayer, tournaments, skins, daily challenges, and more.**

🌐 **Live:** https://checkers-production-08d2.up.railway.app  
📦 **Repo:** https://github.com/maddylady/checkers

---

## Features

### 7 Game Modes

| Mode | Description |
|---|---|
| **vs Bots** | Challenge any of 22 unique AI characters, from Chicky (350 ELO) to DeepCheck (2200 ELO) |
| **Tournament** | 4-player single-elimination bracket — enter names, tap the winner of each match, crown a champion |
| **Gauntlet** | Beat all 22 bots in order without skipping. Progress saved locally. |
| **Local 2P** | Pass-and-play on the same screen |
| **Online** | Real-time multiplayer via 6-character room codes (Socket.io) |
| **Mines Mode** | Hidden mines are buried on the board — land on one and it detonates |
| **Roulette** | Spin the wheel each turn: extra move, skip, or play normally |

### 22 AI Opponents with Real ELO-Based Strength

Each bot has a genuine ELO rating (350–2200) mapped to real AI parameters (minimax depth + randomness). Playing Grandma Rose (420 ELO) feels completely different from playing DeepCheck (2200 ELO).

| Tier | Bots |
|---|---|
| 🟢 Beginner | Chicky (350), Grandma Rose (420), The Jester (480), Lucky Larry (510) |
| 🟡 Intermediate | Detective Dan, Gordon Ramsay, Steve Jobs, The Bookworm, The Coach, Jeff Bezos, Arman Suleimenov, Elon Musk |
| 🔴 Expert | Bruce Lee, Warren Buffett, Napoleon, Cleopatra, The Oracle, Genghis Khan, Sun Tzu, Magnus Jr., Albert Einstein, DeepCheck |

### Rules & Time Controls
- **American** and **Russian** rules variants (Russian: flying kings, backward captures)
- Time controls: untimed, 30s/move, 1min/move, 5min blitz, 15min rapid, 30min classical
- Move expiry options: random move or forfeit

### Progression & Rewards
- **Coins** earned from wins, daily challenges, and streaks
- **Skin Shop** — buy cosmetic piece styles with coins
- **Daily Challenges** — complete specific goals to earn bonus coins and maintain streaks
- **Badge system** — unlock achievement badges shown on your profile
- **ELO rating** — rises and falls based on wins/losses against bots

### Social & Competitive
- **Tournament mode** — run a live 4-player bracket with friends at the same table
- **TikTok Challenge** — post your best game, tag @CheckMateArena, enter the giveaway
- **Global Leaderboard** — synced via Supabase, shows top players with ELO and win rates
- **Profile modal** — full stats, recent game history, badges, streak

### Learning & Analysis
- **Tactics & Strategy panel** — 6 accordion lessons (basics, kings, center control, multi-jump, trading, endgame)
- **Post-game review** — visual board replay with move-by-move comments; navigate with ⏮◀▶⏭
- Highlights missed captures, exposed pieces, and chain opportunities

### UI/UX
- Full **light and dark mode** (Tailwind v4, toggle in navbar)
- Framer Motion animations throughout — piece movement, screen transitions, confetti
- Responsive layout — works on mobile and desktop
- Google sign-in (Supabase Auth) for persistent cross-device stats

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Multiplayer | Socket.io 4 |
| Auth & DB | Supabase (anonymous + Google OAuth) |
| Icons | Lucide React |
| Server | Custom Node.js (Next.js + Socket.io on one port) |
| Hosting | Railway (auto-deploy from main) |

---

## Architecture

```
/checkers
├── app/
│   ├── layout.tsx              Root layout, metadata
│   ├── page.tsx                Home screen, screen router, sidebar tabs
│   └── globals.css             Tailwind base + dark mode config
├── components/
│   ├── Board.tsx               8×8 board, cell click handling, move highlights
│   ├── Piece.tsx               Animated checker piece (regular + king)
│   ├── GamePage.tsx            Game orchestration: AI loop, socket, timers, state
│   ├── GameControls.tsx        Turn indicator, captured count, clock, buttons
│   ├── WinScreen.tsx           Win/loss modal, board replay viewer, share button
│   ├── ModeSelector.tsx        7-mode selector with bot grid, gauntlet, pregame settings
│   ├── TournamentPage.tsx      4-player bracket tournament UI
│   ├── CoachPanel.tsx          Tactics & Strategy accordion lessons
│   ├── Leaderboard.tsx         Global/local player rankings
│   ├── DailyChallenges.tsx     Daily goal tracker with streak
│   ├── SkinShop.tsx            Coin-based cosmetic shop
│   ├── Navbar.tsx              Top bar: theme, coins, profile, Google auth
│   ├── ProfileModal.tsx        Full player stats, history, badges
│   ├── UsernameModal.tsx       First-run setup
│   ├── BadgeUnlockModal.tsx    Achievement notification popup
│   └── RulesModal.tsx          Rules reference
├── lib/
│   ├── game-logic.ts           All checkers rules, move generation, win detection
│   ├── ai.ts                   Minimax + alpha-beta; ELO → depth/randomness mapping
│   ├── storage.ts              localStorage helpers: stats, history, coins, streaks
│   ├── supabase.ts             Supabase client, auth, leaderboard sync
│   ├── gauntlet.ts             Gauntlet progress tracking (localStorage)
│   ├── puzzles.ts              10 tactics drill positions (unused entry point)
│   ├── badges.ts               Badge definitions and unlock logic
│   ├── challenges.ts           Daily challenge definitions
│   └── skins.ts                Skin definitions and unlock state
├── server.js                   Custom server: Next.js + Socket.io on one port
└── package.json
```

---

## Game Logic

All rules live in `lib/game-logic.ts`:

- `createInitialBoard()` — 12 red + 12 black pieces on dark squares
- `getAllValidMoves(board, player)` — mandatory capture rule enforced (captures only if any exist)
- `getChainCaptures()` — recursive multi-jump sequences
- `applyMove(board, move)` — clones board, removes captures, handles promotion
- `checkWinCondition()` — no pieces or no legal moves = loss; 40-move draw rule

### AI Engine (`lib/ai.ts`)

- **`paramsFromStrength(strength)`** — maps ELO 350–2200 to `{ depth, randomChance }` so each bot is genuinely unique
- **`evaluateBoard(board)`** — piece value (man=5, king=10) + advancement + center control + back-row protection + edge penalty
- **`minimax(board, depth, α, β)`** — alpha-beta pruning; iterative depth from easy (1) to hard (7)
- **`getBestMove(board, player, difficulty, botElo?)`** — uses per-bot ELO when provided, falls back to difficulty tier

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Supabase URL and anon key

# Start dev server (Next.js + Socket.io)
npm run dev
```

Open http://localhost:3000

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Deployment

The project is deployed on **Railway** with auto-deploy on push to `main`.

Start command: `NODE_ENV=production node server.js`

`server.js` boots Next.js and attaches Socket.io to the same HTTP server so both run on a single port — required for Railway's single-port environment.

> **Note for Vercel:** Vercel Serverless Functions don't support long-running WebSocket connections. To deploy on Vercel, replace Socket.io with Supabase Realtime or another hosted WebSocket provider.

---

## Scripts

```bash
npm run dev      # Development server (Next.js + Socket.io)
npm run build    # Production build
npm start        # Production server
npm test         # Run unit tests (Vitest)
npm run lint     # ESLint
```

---

## License

MIT — free to use, fork, and build on.

---

*Built with Next.js · Socket.io · Framer Motion · Supabase*
