# TaskFlow

A small full-stack task board (columns + tasks, like a lightweight Trello) built for the TaskFlow
take-home assignment.

- **Frontend:** React (JS) + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite via Node's built-in `node:sqlite` module, with hand-written SQL (no ORM
  query builder, no native npm package to compile)

## Project structure

```
taskflow/
├── server/               Express API + SQLite database
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql      CREATE TABLE statements (source of truth for the schema)
│   │   │   ├── db.js           opens/creates the SQLite file and applies schema.sql
│   │   │   ├── seed.js         wipes + repopulates demo data
│   │   │   └── queries.js      every SQL query the app runs, in one place
│   │   ├── routes/             boards.js, tasks.js
│   │   ├── middleware/         error handling
│   │   ├── app.js              Express app (no listen — used by tests too)
│   │   └── server.js           picks a port, seeds on first run, starts listening
│   └── tests/                  node:test + supertest
└── client/                React app (Vite)
    └── src/
        ├── api/api.js           fetch wrapper for the backend
        └── components/          Board, Column, TaskCard, TaskModal, FilterBar
```

## Data model

```sql
boards(id PK, name NOT NULL, created_at)

columns(id PK, board_id FK -> boards.id, name NOT NULL, position, created_at)

tasks(
  id PK,
  column_id FK -> columns.id,
  title       NOT NULL, CHECK (length(trim(title)) > 0),
  description,
  priority    NOT NULL DEFAULT 'Medium', CHECK (priority IN ('Low','Medium','High')),
  created_at
)
```

Full definitions with indexes: [`server/src/db/schema.sql`](server/src/db/schema.sql).

A task's "status" is simply which column it belongs to (`tasks.column_id`), rather than a
separate status column that would need to be kept in sync with the column it's sitting in.

### The two required non-trivial queries

Both live in [`server/src/db/queries.js`](server/src/db/queries.js) and are exercised by real API
endpoints (not just filtered in JS after fetching everything):

- **`getTaskCountsPerColumn`** — `GET /api/boards/:id/stats` — a `LEFT JOIN` + `GROUP BY` so
  columns with zero tasks still show up with a count of 0.
- **`getTasksByPriority`** — `GET /api/tasks?boardId=1&priority=High` — filters by priority in
  SQL and orders by `created_at DESC` for "newest first."

## Running it locally

Requires **Node.js 22.5+** (developed on Node 22.22) — this is what makes the built-in
`node:sqlite` module available, which is why there's no native module to compile during
`npm install`.

### 1. Backend

```bash
cd server
npm install
npm run dev        # starts the API on http://localhost:4000
```

The database file is created automatically at `server/data/taskflow.db` the first time you run
it, and seeded with one demo board (3 columns, 7 tasks) since it starts out empty. Restarting the
server does **not** re-seed or wipe your data — it only seeds if the `boards` table is empty. To
reset to fresh seed data at any point:

```bash
rm -rf server/data && npm run dev
# or, with the server already running against an existing db:
npm run seed
```

### 2. Frontend

In a second terminal:

```bash
cd client
cp .env.example .env    # points the app at http://localhost:4000/api
npm install
npm run dev              # starts the app on http://localhost:5173
```

Open http://localhost:5173. You should see the "Product Launch" board with three columns.

### 3. Tests

```bash
cd server
npm test
```

10 tests covering: empty-title rejection (both a real request and a whitespace-only title),
moving a task between columns, editing, deleting, invalid `columnId` handling, the nested
board/columns/tasks response shape, and two tests that call the query layer directly against a
known seeded database (`getTaskCountsPerColumn` and `getTasksByPriority` return the exact rows
expected for the seed data).

## Using the app

- **Move a task** either by dragging its card into another column, or via the small dropdown at
  the bottom of each card — both call the same `PATCH /api/tasks/:id/move` endpoint, so pick
  whichever is easier to test.
- **Filter** by priority and/or search by title using the controls above the board; both apply
  client-side to the already-loaded board (see "assumptions" below for why).
- Errors from the backend (failed create/edit/delete/move) show as a dismissible banner instead
  of a blank screen; a failed load shows a retry button instead of the app crashing.

## Assumptions & decisions

- **Single board, no board picker.** The assignment describes one board's worth of features, and
  multi-board/multi-user is explicitly out of scope, so the app just always loads board `id=1`
  rather than building board-switching UI nobody asked for.
- **Filter/search run client-side** against the board payload already in memory, rather than
  re-fetching from the server on every keystroke. For a single board's worth of tasks this is
  simpler and feels instant; the server-side priority-filter endpoint still exists and is tested
  independently since the assignment specifically wants that query to be real SQL.
- **Priority defaults to Medium** if omitted on create, since the spec says priority is optional
  but the schema needs *some* value.
- **Delete uses `window.confirm`** rather than a custom confirmation dialog — simplest option that
  still prevents accidental data loss, given visual polish is explicitly out of scope.
- **Both drag-and-drop and a dropdown are implemented** for moving tasks. The assignment says pick
  one, but the dropdown was needed anyway as a keyboard/no-JS-drag-support fallback, and having
  both meant I didn't have to choose which one to demo.
- **The server seeds automatically only when the database is empty**, so restarting `npm run dev`
  during development never silently wipes changes you made through the UI.

## What I'd improve with more time

- Deploy it (Render for the API, Vercel for the frontend) so there's a live link instead of just
  local setup instructions.
- Add the task-count-per-column stretch goal to the column header in the UI itself (the query and
  endpoint already exist — `GET /api/boards/:id/stats` — it's just not wired into a component yet).
- Optimistic-UI conflict handling: right now if two tabs edit the same task, last write wins
  silently. A real product would want at least a "this task changed elsewhere" warning.
- Reordering tasks *within* a column (currently new/moved tasks always go to the top).
- A proper toast/notification system instead of a single dismissible banner for errors.

## Roughly how long I spent

About 4–5 hours: schema and query design first, then the API and its tests, then the React
frontend, then this write-up.

## Something I found interesting while building this

I started with `better-sqlite3`, but `npm install` failed in one of the environments I tested in
because it couldn't compile the native binding (no prebuilt binary for that platform, and the
fallback source build needs a C++ toolchain). That sent me down a rabbit hole into `node:sqlite`,
which shipped in Node core around v22.5 — it's a synchronous SQLite binding built directly into
Node itself, no npm package or native compile step at all. The sync API initially felt odd for a
server (isn't everything supposed to be async?), but for local-file SQLite it actually sidesteps a
whole class of interleaved-write bugs, and it made the seed script's delete-then-reinsert
transaction trivial to reason about compared to juggling promises. Trading a very mature,
widely-used package for a newer built-in was a real trade-off — `node:sqlite` is still flagged
"experimental" — but zero install-time risk for a take-home assignment felt worth it.
