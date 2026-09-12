# Bomberman DOM

A real-time multiplayer Bomberman-style game built with a custom `mini-framework` (no canvas/webgl); while the game server is built with Node.js and WebSockets.

Players join a queue with a nickname, chat while they wait, then battle in a shared room until one player remains.

## Features

- Two to four players per match, spawning in separate map corners.
- A fixed 19 × 11 map with permanent walls and randomly generated destructible boxes.
- Three lives per player, bombs, blast chain reactions, scoring, and a last-player-standing winner.
- Random box drops: extra bombs, longer flames, and faster movement.
- A waiting queue with a live player count:
  - a four-player queue begins the ready countdown immediately;
  - a queue with at least two players is locked after 20 seconds;
  - the room then shows a 10-second ready countdown.
- WebSocket chat in the waiting queue and during the game. Waiting-chat history is carried into the newly created room.
- Server-authoritative movement, bombs, damage, power-ups, matchmaking, and chat validation/rate limiting.
- DOM rendering designed for a responsive UI: game updates are batched through `requestAnimationFrame`, while player movement is interpolated in the animation loop.

## Controls

| Action | Keys |
| --- | --- |
| Move | Arrow keys or `W` `A` `S` `D` |
| Place a bomb | `Space` |
| Send chat | Type a message and press **Send** / `Enter` |

## Run locally

Install the backend and frontend dependencies separately:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Start the backend in one terminal, and the frontend in another:

```bash
cd backend # or frontend
npm start
# or: node server.js
```

Open [http://localhost:3000](http://localhost:3000). The API and WebSocket server run on port `8080`.

To test a match locally, open the game in two to four separate browser windows or profiles, choose a unique nickname in each, and join the queue.

## How a match works

1. Enter a nickname on the lobby page.
2. Join the waiting queue and use its chat while players arrive.
3. With four players, or after the 20-second queue window has elapsed with at least two players, a room is created.
4. A 10-second ready countdown is displayed.
5. Move, destroy boxes, collect power-ups, and avoid explosions. A player is eliminated after losing all three lives.
6. The surviving player wins. Use **Leave** to return to the lobby at any time.

## Project structure

```text
backend/
├── engine/       # map, game state, matchmaking, chat, and configuration
├── routes/       # HTTP API endpoints
└── services/     # router and WebSocket connection manager

frontend/
├── src/components/ # virtual-DOM UI components
├── src/scripts/    # game animation, HUD, and chat behaviour
├── src/services/   # HTTP and WebSocket clients
├── src/state/      # mini-framework state stores
└── styles/         # layout and component styles
```

## Technical notes

- No Canvas, WebGL, or external UI framework is used.
- The frontend uses the custom mini-framework for routing, state subscriptions, virtual-DOM creation, and DOM patching.
- The visible board is DOM-based. Static board changes are rendered only after new server state arrives; the active animation loop uses `requestAnimationFrame` for smooth player motion.
- The server accepts WebSocket connections only from `http://localhost:3000`, and applies payload-size, message-length, and chat-rate limits.

## HTTP endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/config` | Public game configuration |
| `POST` | `/api/players` | Create a player and join the queue |
| `GET` | `/api/players/:id` | Read a player's queue/room status |
| `DELETE` | `/api/players/:id` | Leave the queue or room |
| `GET` | `/api/rooms/:id` | Read room details |

The WebSocket endpoint is `ws://localhost:8080/ws?playerId=<player-id>`.
