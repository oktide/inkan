# inkan

A terminal kanban board built with [Ink](https://github.com/vadimdemedes/ink) and TypeScript.

Organize tasks across **walls**, **boards**, and **columns** with vim-style navigation, slash commands, and inline autocomplete.

## Install

```bash
git clone https://github.com/oktide/inkan.git
cd inkan
npm install
npm run build
npm link  # makes `inkan` available globally
```

## Usage

```bash
inkan
```

### Navigation

| Key | Action |
|-----|--------|
| `h/l` or `←/→` | Move between columns |
| `j/k` or `↓/↑` | Move between tasks |
| `Enter` | Open task detail |
| `n` | Quick-add task to current column |
| `d` | Delete selected task |
| `m` then `h/l` | Move task left/right |
| `v` | Toggle task body viewer |
| `/` | Open command bar |
| `?` | Toggle help overlay |
| `q` | Quit |

### Commands

| Command | Description |
|---------|-------------|
| `/new [task\|board\|wall\|column] <name>` | Create a task, board, wall, or column |
| `/delete [task\|board\|wall\|column] <name>` | Delete a task, board, wall, or column |
| `/move <title> -c <col> [-b <board>] [-w <wall>]` | Move task to column, board, or wall |
| `/wall <name>` | Switch to a wall |
| `/board <name>` | Switch to a board |
| `/edit <title>` | Open task for editing |
| `/open <title>` | Open task detail + body |
| `/search <query>` | Filter visible tasks |
| `/help` | Show all keybindings |

The command bar has Tab-completion with ghost text for task titles, column names, board names, and wall names.

### Organization

**Walls** contain **boards**, and each board has its own **columns** and **tasks**.

```
Wall (e.g. "Work")
├── Board (e.g. "Sprint 1")
│   ├── Todo
│   ├── In Progress
│   └── Done
└── Board (e.g. "Sprint 2")
    ├── Todo
    ├── In Progress
    └── Done
```

The header shows your current location as `Wall / Board`.

### Task bodies

Each task can have a markdown body, stored as a separate file in `~/.config/inkan/tasks/<id>.md`. Press `v` to view inline or open with your `$EDITOR` from the task detail screen.

## Data

All data is stored locally in `~/.config/inkan/`:
- `board.json` — walls, boards, columns, and task metadata
- `tasks/*.md` — task body files

Existing single-board data from older versions is auto-migrated on first run.

## Development

```bash
npm run dev       # run directly with tsx (no compile step)
npm run build     # compile TypeScript to dist/
npx tsc --noEmit  # type-check only
```

## License

MIT
