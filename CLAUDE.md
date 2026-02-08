# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

- **Dev (no compile):** `npm run dev` — runs `tsx src/index.tsx` directly
- **Build:** `npm run build` — compiles TypeScript to `dist/` via `tsc`
- **Type-check:** `npx tsc --noEmit`
- **Run compiled:** `npm start` or `inkan` (symlinked to `~/.local/bin/inkan`)

There are no tests or linting configured.

## Architecture

Terminal kanban app built with **Ink 5** (React for the terminal), **TypeScript**, and **ESM modules** (`"type": "module"`, NodeNext resolution). All imports use `.js` extensions even for `.ts`/`.tsx` source files.

### Entry flow

`bin/inkan.js` → `dist/index.js` (compiled from `src/index.tsx`) → renders `<App />` with Ink's `render()`.

### Data model

Hierarchical: **Walls** contain **Boards**, each board has its own columns and tasks.

```
AppData (version: 2)
├── Wall[]
│   ├── Board[]
│   │   ├── Column[] (each has taskIds[])
│   │   └── tasks: Record<string, Task>
│   └── id, name
├── activeWallId
└── activeBoardId
```

Types defined in `src/types.ts`: `Task`, `Column`, `Board` (has `id`), `Wall`, `AppData`.

### State management

- **App state** (`useBoard` hook): `useReducer` over `AppData`. Every mutation auto-saves to disk synchronously via `storage.ts`. The `updateActiveBoard()` helper locates the active wall/board and applies immutable updates. Actions: ADD_TASK, DELETE_TASK, MOVE_TASK, MOVE_TASK_TO (cross-board/wall), EDIT_TASK, ADD_COLUMN, REMOVE_COLUMN, SEARCH, CLEAR_SEARCH, ADD_WALL, SWITCH_WALL, DELETE_WALL, ADD_BOARD, SWITCH_BOARD, DELETE_BOARD.
- **Navigation state** (`useNavigation` hook): `useState`-based 2D cursor (columnIndex, taskIndex) with boundary clamping. Separate from board state.
- **UI mode**: Single `AppMode` state machine in `App.tsx` — `"board"` | `"command"` | `"detail"` | `"confirm"`. All keyboard input is routed through `useInput` in App.tsx based on current mode.

### Storage

Data lives in `~/.config/inkan/`:
- `board.json` — full `AppData` JSON (walls, boards, columns, task metadata, active IDs)
- `tasks/<id>.md` — task body as separate markdown files (editable with `$EDITOR`)

**Migration:** `loadAppData()` detects legacy format (has `columns`+`tasks` at top level, no `version` field) and auto-migrates into a "Default" wall. Task body files are preserved (IDs unchanged).

Task bodies are intentionally **not** stored in the JSON; loaded on-demand via `loadTaskBody(id)`.

### Component tree

```
App.tsx (mode state machine + input routing)
├── Board → Column[] → Card[]     (mode: board)
├── TaskDetail                     (mode: detail, opens $EDITOR for body)
├── TaskDrawer                     (inline body viewer, toggled with 'v')
├── CommandBar                     (mode: command, with autocomplete dropdown)
├── QuickAddInput                  (inline, triggered by 'n' key)
└── HelpBar                        (always visible, '?' toggles full overlay)
```

Header displays breadcrumb: `Wall / Board`.

### Command system

`commands.ts` parses `/command [args...]` input and returns a `CommandResult`. The `CommandBar` component has its own autocomplete UI with a `COMMANDS` registry. Commands dispatch to `useBoard` actions or trigger mode changes.

**Commands:**
- `/new [task|board|wall|column] <name>` — create (bare `/new <name>` creates a task for backward compat)
- `/delete [task|board|wall|column] <name>` — delete (bare `/delete <name>` deletes a task)
- `/move <title> -c <col> [-b <board>] [-w <wall>]` — flag-based move, supports cross-board/wall
- `/wall <name>`, `/board <name>` — switch context
- `/edit`, `/open`, `/search`, `/help` — unchanged

**CommandBar autocomplete** uses an `ArgPhase` system. For `/move`, phase is determined by the last flag (`-c`→column, `-b`→board, `-w`→wall, none→task). Ghost text suggests matching candidates from the appropriate list. `/new` has a `newSub` phase for subcommand completion. `/delete` routes to wall/board/column/task phases based on the subcommand word.

### Key patterns

- IDs generated with `nanoid(8)`
- Immutable state updates via spread operators in the reducer
- Synchronous file I/O (fine for a CLI tool)
- `execSync` with `stdio: "inherit"` for launching `$EDITOR`
- Fuzzy matching (case-insensitive includes) for task/column/wall/board lookup in commands
- `parseMoveFlags()` splits on `\s+(?=-(c|b|w)\s)` regex to extract flag values
