<div align="center">

# AI Grand Prix

**Build a car. Teach it the track. Race 19 rivals.**

A browser racing game about how AI learns: your car only knows what you teach it.

<img src=".github/readme/race.gif" alt="A 20-car race on Dune Valley, then the incident screen as your car loses time" width="600">

</div>

---

## How a round works

<table>
<tr>
<td width="50%" valign="top">

### 1 · Make it yours
Pick one of 11 F1 teams or name your own, then choose paint, finish, stripes, helmet and race number on a spotlit turntable. Looks only, no effect on pace.

</td>
<td width="50%"><img src=".github/readme/showroom.gif" alt="Changing teams in the showroom: McLaren orange, Ferrari red, Williams blue"></td>
</tr>
<tr>
<td width="50%"><img src=".github/readme/garage.png" alt="The garage: parts shelf, 3D car and car stats"></td>
<td width="50%" valign="top">

### 2 · Build and test
Drag parts onto the 3D car across five slots: tyres, power, aero, chassis and sensor. You have 90 credits, which isn't enough for the best of everything. Two test laps show where your car struggles.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 3 · Race
Eight laps against 19 rivals in about 3 minutes, with TV-style cameras, a live timing tower and race chat. If a section is beyond your car, you lose time, and the race pauses to show what happened.

</td>
<td width="50%"><img src=".github/readme/incident.png" alt="The incident screen: what happened and the time lost"></td>
</tr>
<tr>
<td width="50%"><img src=".github/readme/results.png" alt="Results: finishing place, incident reel and lessons"></td>
<td width="50%" valign="top">

### 4 · Learn and rebuild
The results show your finishing place, a replay of every incident, and what the race revealed about the track. Rebuild from the same car and try again.

</td>
</tr>
</table>

## Play it

Needs Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Then open **http://127.0.0.1:4174**. On macOS you can also double-click **Start Preview.command**.

## What's inside

|  |  |
|---|---|
| **3 tracks** | Dune Valley (hot, abrasive), Mountain Pass (cold, wet), Quarry Ring (bumpy). Each has 4–5 sections that test different parts of the car. |
| **28 parts** | 9 tyres, 6 power units, 5 aero packages, 4 chassis and 4 sensors, each with its own look on the car. No single build wins on every track. |
| **Incidents** | Most cost a few seconds, and a crash costs more. Only a brake fire puts you out of the race. Each one is warned about ahead of time and replayable afterwards. |
| **Broadcast view** | TV director, circuit and follow cameras, picture-in-picture for simultaneous incidents, a minimap, and callouts for overtakes and battles. |
| **Race chat** | Race control, rivals reacting to what happens on track, and your own messages and reactions. |
| **Field notes** | Rae, your race engineer, explains each step as teaching an AI: data → label → training → validation → real world. |

## Infrastructure

The architecture is designed for live multiplayer sessions: a host runs a room, about 40 players join with a code, and everyone races on one server-timed grid. The game rules are pure and deterministic, so the same code runs in the browser and on the server.

```mermaid
flowchart LR
  P["Players<br/>web app"] -- "commands" --> S
  H["Host console<br/>+ projector view"] -- "phase controls" --> S
  S["Game server<br/>Node + Colyseus<br/>shared game rules"] -- "snapshots" --> P
  S -- "snapshots" --> H
  S --- DB[("PostgreSQL<br/>rooms, builds, results")]
  S -.- R[("Redis<br/>horizontal scaling")]
```

| Layer | Design | Why |
|---|---|---|
| **Client** | TypeScript and a component UI layer, with three.js for the 3D garage, showroom and circuit | Shared types keep client and server data in step. Rendering stays separate from game logic. |
| **Game server** | Node.js and TypeScript, with [Colyseus](https://colyseus.io) rooms over WebSockets | Rooms, joining, state sync and reconnecting, running the same rules module as the client. |
| **Authority** | The server owns the clock, the race timeline and ERS boost timestamps | Clients send commands and only display what comes back, so no client can change an outcome. |
| **Session** | One session interface (`getSnapshot`, `subscribe`, `dispatch`) with local and WebSocket adapters | Views never change between single-player and multiplayer. |
| **Data** | PostgreSQL for hosts, rooms, players, builds, runs and results; Redis for shared room state across server instances | Results history supports progress tracking across sessions. |
| **Identity** | Hosts sign in with an email link or Google. Players join with a room code and a name. | No accounts for players; history and controls for hosts. |
| **Content** | Parts, tracks and rivals as versioned data, gated by an automated balance check | Balance can be tuned without a code deploy. |
| **Operations** | Static frontend on a CDN, WebSocket servers on Fly.io or Render, managed Postgres, CI on every pull request, error monitoring | Long-lived connections, preview deploys, and room metrics such as players connected and latency. |

**Surfaces:** player app, host console (create a room, run each phase, pause the race, manage players), projector view using the broadcast cameras, and a progress dashboard for hosts.

**Design notes**

- Races are deterministic, so a full race timeline can be sent at lights out with no lag. Streaming it in chunks keeps results hidden until they happen.
- Chat rules (length, rate limit, word filter) live in the shared rules module, so the server enforces exactly what the client shows.
- The repository is organised to split into `packages/shared`, `apps/web` and `apps/server` without changing behaviour.

<details>
<summary><b>How the prototype is built</b></summary>

<br>

Vanilla JavaScript, [Vite](https://vitejs.dev) and [three.js](https://threejs.org). No framework, no backend.

- `shared/` holds the game rules: parts, tracks, race timeline and incidents. They are pure and deterministic, and ready to move to a server unchanged.
- `src/adapters/local-session.js` is the session. Views read snapshots and send commands, and never decide outcomes themselves.
- `src/ui/` builds the interface and `src/scene/` draws the 3D garage, showroom and circuit.

Races are authored and repeatable, not a physics simulation. The 19 rivals and the chat are simulated, and refreshing the page starts a new session.

</details>

<details>
<summary><b>Tests</b></summary>

<br>

```sh
npm test               # game rules, including a balance check on every affordable build
npm run build          # production bundle
npm run test:browser   # Playwright, plays full races, takes a few minutes
```

If Chromium is missing, run `npx playwright install chromium`.

</details>

<details>
<summary><b>Team logos</b></summary>

<br>

No official logos are included. Each team shows an original badge in its colours. Logo files you have permission to use can be added to `public/team-logos/` (see the README there).

</details>

<br>

<div align="center"><sub>An independent prototype. Not affiliated with Formula 1 or any team.</sub></div>
