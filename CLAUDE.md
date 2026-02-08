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

### State management

- **Board state** (`useBoard` hook): `useReducer` with discriminated union actions. Every mutation auto-saves to disk synchronously via `storage.ts`. Actions: ADD_TASK, DELETE_TASK, MOVE_TASK, EDIT_TASK, ADD_COLUMN, REMOVE_COLUMN, SEARCH, CLEAR_SEARCH.
- **Navigation state** (`useNavigation` hook): `useState`-based 2D cursor (columnIndex, taskIndex) with boundary clamping. Separate from board state.
- **UI mode**: Single `AppMode` state machine in `App.tsx` — `"board"` | `"command"` | `"detail"` | `"confirm"`. All keyboard input is routed through `useInput` in App.tsx based on current mode.

### Storage

Data lives in `~/.config/inkan/`:
- `board.json` — columns and task metadata (titles, priority, due dates, tags, timestamps)
- `tasks/<id>.md` — task body as separate markdown files (editable with `$EDITOR`)

Task bodies are intentionally **not** stored in the JSON. The `description` field was removed from the Task type; bodies are loaded on-demand via `loadTaskBody(id)`.

### Component tree

```
App.tsx (mode state machine + input routing)
├── Board → Column[] → Card[]     (mode: board)
├── TaskDetail                     (mode: detail, opens $EDITOR for body)
├── CommandBar                     (mode: command, with autocomplete dropdown)
├── QuickAddInput                  (inline, triggered by 'n' key)
└── HelpBar                        (always visible, '?' toggles full overlay)
```

### Command system

`commands.ts` parses `/command [args...]` input and returns a `CommandResult`. The `CommandBar` component has its own autocomplete UI with a `COMMANDS` registry. Commands dispatch to `useBoard` actions or trigger mode changes.

### Key patterns

- IDs generated with `nanoid(8)`
- Immutable state updates via spread operators in the reducer
- Synchronous file I/O (fine for a CLI tool)
- `execSync` with `stdio: "inherit"` for launching `$EDITOR`
- Fuzzy matching (case-insensitive includes) for task/column lookup in commands
