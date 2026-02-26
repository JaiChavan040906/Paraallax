# Paraallax — CSI Event Puzzle Platform

> Terminal-themed, team-based puzzle competition app built with **Next.js 14 App Router**, **MongoDB Atlas**, and **Tailwind CSS**. JavaScript only.

---

## Quick Start

### 1. MongoDB Atlas Setup
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user (username + password)
3. Get your connection string: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/paraallax`
4. In **Network Access**, allow your IP (or `0.0.0.0/0` for event day)

### 2. Environment Variables
Copy `.env.local.example` → `.env.local` and fill in:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/paraallax?retryWrites=true&w=majority
JWT_SECRET=your_random_long_secret_here
ADMIN_EMAIL=admin@csi.com
ADMIN_PASSWORD=Admin@CSI2025
TEAM_DEFAULT_PASSWORD=team123
```

### 3. Install Dependencies
```bash
cd paraallax
npm install
```

### 4. Run Seed Scripts
```bash
node scripts/seedAdmin.js    # Creates admin account
node scripts/seedTeams.js    # Creates T01–T20 teams
node scripts/seedPuzzles.js  # Inserts 21 puzzles into the pool
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Event Day Operation Guide

### Before the Event
1. Deploy to Vercel (connect GitHub repo → set env vars in Vercel dashboard)
2. Run seeds against Atlas production DB
3. Print team password sheet (all teams use `TEAM_DEFAULT_PASSWORD` by default)
4. Open each computer lab PC at: `http://<your-domain>/team/login?tid=T01` (replace T01 with the assigned TID)

### Opening Each Computer Lab PC
Each PC is pre-assigned a Team ID. Open the browser to:
```
https://your-app.vercel.app/team/login?tid=T07
```
The TID is locked in the URL — teams only enter their password.

### Admin Operation Steps

1. **Admin logs in**: Open `/admin/login` on the admin PC, enter credentials.

2. **Teams log in**: Teams enter their password at `/team/login?tid=Txx`. They land on the **Waiting** screen automatically.

3. **Create a Room**:
   - In the admin dashboard, waiting teams appear with checkboxes.
   - Select which teams are participating today.
   - Set **Puzzles per Team** (e.g., 5).
   - Click **CREATE ROOM**.

4. **Start the Game**:
   - Set **Duration** in minutes (e.g., 90).
   - Click **▶ START GAME**.
   - Team screens auto-redirect from Waiting → Game within 10 seconds (polling).

5. **Monitor Progress**:
   - Paste the Room ID into the **View Leaderboard** box.
   - Dashboard polls every 10 seconds showing: solved count, penalty, status, time left.

6. **End of Game**:
   - Teams that solve all puzzles → see **MISSION ACCOMPLISHED** screen.
   - Teams that run out of time → see **CAUGHT** screen.
   - Leaderboard ranks by: solved count (desc), then penalty (asc).

---

## Game Rules

| Rule | Detail |
|------|--------|
| Wrong answer penalty | -5 minutes per wrong submission |
| Time formula | `(startTime + duration) - now - penaltySeconds` |
| All solved | Team status → `success` |
| Time reaches 0 | Team status → `caught` |
| Puzzle navigation | Use PREV / NEXT to switch puzzles freely |
| Attempts | Unlimited submissions per puzzle |

---

## Project Structure

```
paraallax/
├── app/
│   ├── layout.js                    # Root layout
│   ├── page.js                      # Landing page
│   ├── globals.css                  # Tailwind + terminal theme
│   ├── team/
│   │   ├── login/page.js            # Team login (TID from URL)
│   │   ├── waiting/page.js          # Waiting room (polls)
│   │   ├── game/page.js             # Game screen (polls)
│   │   ├── success/page.js          # All solved screen
│   │   └── caught/page.js           # Time expired screen
│   ├── admin/
│   │   ├── login/page.js            # Admin login
│   │   └── dashboard/page.js        # Control panel + leaderboard
│   └── api/
│       ├── team/login/route.js
│       ├── team/me/route.js
│       ├── team/state/route.js      # Core game state + time
│       ├── team/navigate/route.js
│       ├── team/submit/route.js     # Answer validation + penalty
│       ├── admin/login/route.js
│       ├── admin/teams/route.js
│       ├── admin/room/create/route.js
│       ├── admin/room/start/route.js  # Deck-deal assignment
│       └── admin/leaderboard/route.js
├── components/
│   ├── PuzzleRenderer.js            # Type switcher
│   └── puzzles/
│       ├── LogicPuzzle.js           # MCQ renderer
│       ├── HandshakePuzzle.js       # Action button renderer
│       └── SchemaPuzzle.js          # DB table renderer
├── lib/
│   ├── db.js                        # MongoDB connection (cached)
│   ├── session.js                   # JWT cookie helpers
│   └── auth.js                      # getTeamFromRequest / getAdminFromRequest
├── models/
│   ├── Team.js
│   ├── Room.js
│   ├── Puzzle.js
│   └── Admin.js
├── scripts/
│   ├── seedAdmin.js
│   ├── seedTeams.js
│   └── seedPuzzles.js
├── .env.local.example
├── .gitignore
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Vercel Deployment

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add all env vars from `.env.local` in Vercel project settings
4. Deploy — Vercel auto-detects Next.js

> **Note:** Do NOT commit `.env.local`. It is in `.gitignore`.

---

## Adding More Puzzles

Edit `scripts/seedPuzzles.js` and add a new object to the `puzzles` array:
```js
{
  puzzleId: 'P-22',          // Must be unique
  type: 'logic',             // logic | handshake | schema
  title: 'My New Puzzle',
  prompt: 'Question text here...',
  uiConfig: { options: [...] },
  answer: 'correctAnswer',
  penaltySecondsOnWrong: 300,
}
```
Then re-run `node scripts/seedPuzzles.js`.

## Adding New Puzzle Renderer Types

1. Create `components/puzzles/MyNewType.js`
2. Add a `case 'myNewType':` in `components/PuzzleRenderer.js`
3. Set `type: 'myNewType'` on puzzle documents in DB

No DB schema changes needed.
