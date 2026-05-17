# CheckMate Arena

**The ultimate competitive checkers (draughts) experience — play against AI, challenge friends locally, or battle online in real-time.**

---

## Who It's For

CheckMate Arena is built for anyone who loves classic strategy games and wants a modern, polished experience:

- **Casual players** looking for a quick, beautiful checkers game without installing anything
- **Strategy enthusiasts** who want a tough AI opponent and post-game coaching
- **Friends** who want to play each other remotely with instant room codes
- **Learners** who want to improve with AI analysis that spots missed captures and blunders

---

## Value Proposition

| Feature | CheckMate Arena | Generic checkers app |
|---|---|---|
| AI difficulty levels | Easy / Medium / Hard (Minimax alpha-beta) | One level |
| Post-game coaching | Yes — move-by-move analysis | No |
| Real-time online multiplayer | Yes — Socket.io room codes | Rarely |
| Modern animations | Framer Motion throughout | Static |
| Leaderboard | Local + seeded global entries | No |
| Mobile responsive | Fully responsive | Often not |

---

## Features

### Full English Draughts Rules
- Standard 8x8 board, pieces on dark squares
- Red pieces start top, Black pieces start bottom
- Diagonal movement only for regular pieces
- **Mandatory captures** — if a capture is available, you must take it
- **Chain captures** — if another capture is available after capturing, you must continue
- **King promotion** — reach the opposite back row to become a King
- Kings move and capture in all four diagonal directions
- Win by capturing all opponent pieces or leaving them with no valid moves

### Three Game Modes

**vs AI**
- Easy: Mostly random moves, great for beginners
- Medium: Minimax search depth 4 with alpha-beta pruning
- Hard: Full depth-7 alpha-beta search — genuinely challenging

**Local 2-Player**
- Pass-and-play on the same screen
- Perfect for casual matches with a friend

**Online Multiplayer**
- Create a room and get a 6-character code
- Share the code with your opponent — they join instantly
- Powered by Socket.io for real-time WebSocket communication
- Reconnection support if connection drops

### AI Coach (Post-Game Analysis)
After every game, the AI coach reviews your moves and reports:
- Missed mandatory captures
- Moves that left pieces exposed to immediate capture
- Exposed king warnings
- Chain capture opportunities you didn't take

### Leaderboard & Stats
- Choose a username and city on first visit (stored in localStorage)
- Wins, losses, draws and win rate tracked locally
- **City-based leaderboard** — filter top players by city (e.g. "Top players from Almaty")
- **Game history tab** — view your last 20 games with result, opponent, mode, duration, and date
- Stats update automatically after every game

### Beautiful UI/UX
- Dark/light theme toggle
- Gradient background with subtle ambient glow
- Piece selection highlights valid moves in green
- Smooth spring animations for piece movement (Framer Motion)
- Per-turn countdown timer (30 seconds) with auto-move on timeout
- Captured pieces display with visual count
- Confetti celebration on win screen
- Win screen with AI Coach analysis panel

### Monetization
- "Upgrade Pro" button in navbar
- Stripe-style pricing modal (no real payment)
- Pro features listed: custom skins, advanced analysis, private rooms, stats heatmaps

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Multiplayer | Socket.io 4 |
| Icons | Lucide React |
| Storage | localStorage (Supabase integration in progress) |
| Server | Custom Node.js (Next.js + Socket.io on one port) |

---

## Architecture

```
/checkers
├── app/
│   ├── layout.tsx          — Root layout with metadata
│   ├── page.tsx            — Home page (landing + mode select)
│   ├── globals.css         — Base styles + Tailwind
│   └── api/socket/
│       └── route.ts        — Placeholder (real socket is in server.js)
├── components/
│   ├── Board.tsx           — 8x8 game board with cell click handling
│   ├── Piece.tsx           — Animated checker piece with king crown
│   ├── GameControls.tsx    — Turn indicator, captured pieces, timer, buttons
│   ├── GamePage.tsx        — Full game orchestration (AI loop, socket, state)
│   ├── WinScreen.tsx       — Win/loss/draw modal with confetti + analysis
│   ├── Navbar.tsx          — Top bar with theme toggle + Pro upgrade modal
│   ├── Leaderboard.tsx     — Ranked player list sidebar
│   ├── ModeSelector.tsx    — Game mode + difficulty selection UI
│   └── UsernameModal.tsx   — First-run username + city prompt
├── lib/
│   ├── game-logic.ts       — All checkers rules, board state, move generation
│   ├── ai.ts               — Minimax engine with alpha-beta pruning
│   └── storage.ts          — localStorage helpers for stats, history, leaderboard, city
├── server.js               — Custom server: Next.js + Socket.io
└── package.json
```

---

## Game Logic Details

The entire rules engine lives in `lib/game-logic.ts`:

- `createInitialBoard()` — Places 12 red and 12 black pieces on starting squares
- `getAllValidMoves(board, player)` — Returns all legal moves; capture moves are returned exclusively when any capture is available (mandatory capture rule)
- `getChainCaptures()` — Recursively finds multi-jump sequences
- `applyMove(board, move)` — Mutates a clone of the board, handles captures and promotion
- `checkWinCondition()` — Detects wins (no pieces, no moves) and draws
- `analyzeGame()` — Post-game analysis comparing each played move against available alternatives

### AI Engine (`lib/ai.ts`)

- `evaluateBoard(board)` — Heuristic scoring: piece value (5 for regular, 10 for king), advancement bonus, center control bonus, back-row protection, edge penalty
- `minimax(board, depth, alpha, beta, maximizing)` — Negamax-style search with alpha-beta pruning; red maximizes, black minimizes
- `getBestMove(board, player, difficulty)` — Entry point; Easy adds 60% randomness, Hard goes full depth-7

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (Next.js + Socket.io)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open http://localhost:3000 in your browser.

For online multiplayer, both players need to be able to reach the same server. In development, both players can use the same machine on localhost.

---

## Deployment Plan

### Recommended Order

1. **Deploy the stable Next.js build to Vercel** for the public demo link.
2. **Add Supabase Auth** with Google sign-in so players have persistent identities.
3. **Move stats, game history, leaderboards, and rooms to Supabase** so progress works across devices.
4. **Replace the custom Socket.io server for Vercel deployments** with Supabase Realtime, Ably, Pusher, Convex, or another hosted realtime provider.

### Important Vercel Note

The current `server.js` is a custom Node.js + Socket.io server. That works locally and on serverful hosts such as Railway, Render, Fly.io, or a VPS. Vercel can deploy the Next.js app, but Vercel Serverless Functions are not the right place to host a long-running Socket.io server. For a production Vercel deployment, keep the app on Vercel and move realtime multiplayer to Supabase Realtime or another realtime provider.

### Supabase Environment Variables

When Supabase is added, create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

For Google sign-in, configure Google as an OAuth provider in the Supabase dashboard and add the production callback URL to the Supabase redirect allow list.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `HOSTNAME` | `localhost` | Bind address |
| `NODE_ENV` | `development` | Set to `production` for prod mode |

---

## Roadmap

- [ ] Supabase backend — global persistent leaderboard, cross-device stats sync
- [ ] Tournament bracket mode
- [ ] Game replay viewer (step through move history)
- [ ] International draughts rules (10x10 board)
- [ ] Mobile app (React Native)
- [ ] Real Stripe payment integration for Pro tier
- [ ] Custom piece skins and board themes (Pro)
- [ ] ELO rating system

---

## License

MIT — free to use, fork, and deploy.

---

*Built with Next.js, Socket.io, and Framer Motion. CheckMate Arena is a demonstration product.*
