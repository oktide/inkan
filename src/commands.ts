import type { Board, Wall } from "./types.js";

export interface CommandResult {
  success: boolean;
  message: string;
}

interface CommandContext {
  board: Board;
  activeWall: Wall;
  walls: Wall[];
  currentColumnId: string;
  addTask: (columnId: string, title: string) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string) => void;
  addColumn: (name: string) => void;
  removeColumn: (columnId: string) => void;
  search: (query: string) => void;
  clearSearch: () => void;
  openEditTask: (taskId: string) => void;
  showHelp: () => void;
  addWall: (name: string) => void;
  deleteWall: (wallId: string) => void;
  switchWall: (wallId: string) => void;
  addBoard: (name: string) => void;
  deleteBoard: (boardId: string) => void;
  switchBoard: (boardId: string) => void;
}

function findTaskByTitle(board: Board, title: string): { taskId: string; columnId: string } | null {
  const lower = title.toLowerCase();
  for (const col of board.columns) {
    for (const taskId of col.taskIds) {
      const task = board.tasks[taskId];
      if (task && task.title.toLowerCase().includes(lower)) {
        return { taskId, columnId: col.id };
      }
    }
  }
  return null;
}

function findColumnByName(board: Board, name: string): string | null {
  const lower = name.toLowerCase();
  const col = board.columns.find((c) => c.name.toLowerCase().includes(lower));
  return col?.id ?? null;
}

function findWallByName(walls: Wall[], name: string): Wall | null {
  const lower = name.toLowerCase();
  return walls.find((w) => w.name.toLowerCase().includes(lower)) ?? null;
}

function findBoardByName(wall: Wall, name: string): Board | null {
  const lower = name.toLowerCase();
  return wall.boards.find((b) => b.name.toLowerCase().includes(lower)) ?? null;
}

export function executeCommand(input: string, ctx: CommandContext): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return { success: false, message: "Empty command" };

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0]!.toLowerCase();
  const args = parts.slice(1).join(" ");

  switch (cmd) {
    case "new": {
      if (!args) return { success: false, message: "Usage: /new [task|board|wall|column] <name>" };
      const firstWord = parts[1]?.toLowerCase();
      const rest = parts.slice(2).join(" ");

      if (firstWord === "wall") {
        if (!rest) return { success: false, message: "Usage: /new wall <name>" };
        ctx.addWall(rest);
        return { success: true, message: `Created wall "${rest}"` };
      }
      if (firstWord === "board") {
        if (!rest) return { success: false, message: "Usage: /new board <name>" };
        ctx.addBoard(rest);
        return { success: true, message: `Created board "${rest}"` };
      }
      if (firstWord === "column") {
        if (!rest) return { success: false, message: "Usage: /new column <name>" };
        ctx.addColumn(rest);
        return { success: true, message: `Added column "${rest}"` };
      }
      if (firstWord === "task") {
        if (!rest) return { success: false, message: "Usage: /new task <name>" };
        ctx.addTask(ctx.currentColumnId, rest);
        return { success: true, message: `Created "${rest}"` };
      }
      // Backward compat: /new <title> creates a task
      ctx.addTask(ctx.currentColumnId, args);
      return { success: true, message: `Created "${args}"` };
    }

    case "delete": {
      if (!args) return { success: false, message: "Usage: /delete [board|wall|column] <name>" };
      const firstWord = parts[1]?.toLowerCase();
      const rest = parts.slice(2).join(" ");

      if (firstWord === "wall") {
        if (!rest) return { success: false, message: "Usage: /delete wall <name>" };
        if (ctx.walls.length <= 1) return { success: false, message: "Cannot delete the last wall" };
        const wall = findWallByName(ctx.walls, rest);
        if (!wall) return { success: false, message: `Wall "${rest}" not found` };
        ctx.deleteWall(wall.id);
        return { success: true, message: `Deleted wall "${wall.name}"` };
      }
      if (firstWord === "board") {
        if (!rest) return { success: false, message: "Usage: /delete board <name>" };
        if (ctx.activeWall.boards.length <= 1) return { success: false, message: "Cannot delete the last board" };
        const board = findBoardByName(ctx.activeWall, rest);
        if (!board) return { success: false, message: `Board "${rest}" not found` };
        ctx.deleteBoard(board.id);
        return { success: true, message: `Deleted board "${board.name}"` };
      }
      if (firstWord === "column") {
        if (!rest) return { success: false, message: "Usage: /delete column <name>" };
        const colId = findColumnByName(ctx.board, rest);
        if (!colId) return { success: false, message: `Column "${rest}" not found` };
        const col = ctx.board.columns.find((c) => c.id === colId);
        if (col && col.taskIds.length > 0) {
          return { success: false, message: "Cannot remove non-empty column" };
        }
        ctx.removeColumn(colId);
        return { success: true, message: `Removed column "${col?.name}"` };
      }
      // Backward compat: /delete <taskname>
      const found = findTaskByTitle(ctx.board, args);
      if (!found) return { success: false, message: `Task "${args}" not found` };
      ctx.deleteTask(found.taskId);
      return { success: true, message: `Deleted "${ctx.board.tasks[found.taskId]?.title}"` };
    }

    case "wall": {
      if (!args) return { success: false, message: "Usage: /wall <name>" };
      const wall = findWallByName(ctx.walls, args);
      if (!wall) return { success: false, message: `Wall "${args}" not found` };
      ctx.switchWall(wall.id);
      return { success: true, message: `Switched to wall "${wall.name}"` };
    }

    case "board": {
      if (!args) return { success: false, message: "Usage: /board <name>" };
      const board = findBoardByName(ctx.activeWall, args);
      if (!board) return { success: false, message: `Board "${args}" not found` };
      ctx.switchBoard(board.id);
      return { success: true, message: `Switched to board "${board.name}"` };
    }

    case "move": {
      // /move <title> <column>
      // Try to split: last word(s) matching a column name
      if (!args) return { success: false, message: "Usage: /move <title> <column>" };
      // Try matching column name from the end
      for (let i = parts.length - 1; i >= 2; i--) {
        const colName = parts.slice(i).join(" ");
        const colId = findColumnByName(ctx.board, colName);
        if (colId) {
          const taskTitle = parts.slice(1, i).join(" ");
          const found = findTaskByTitle(ctx.board, taskTitle);
          if (!found) return { success: false, message: `Task "${taskTitle}" not found` };
          ctx.moveTask(found.taskId, found.columnId, colId);
          return { success: true, message: `Moved to ${ctx.board.columns.find((c) => c.id === colId)?.name}` };
        }
      }
      return { success: false, message: "Could not find target column" };
    }

    case "edit": {
      if (!args) return { success: false, message: "Usage: /edit <title>" };
      const found = findTaskByTitle(ctx.board, args);
      if (!found) return { success: false, message: `Task "${args}" not found` };
      ctx.openEditTask(found.taskId);
      return { success: true, message: "" };
    }

    case "open": {
      if (!args) return { success: false, message: "Usage: /open <title>" };
      const found = findTaskByTitle(ctx.board, args);
      if (!found) return { success: false, message: `Task "${args}" not found` };
      ctx.openEditTask(found.taskId);
      return { success: true, message: "" };
    }

    case "search": {
      if (!args) {
        ctx.clearSearch();
        return { success: true, message: "Search cleared" };
      }
      ctx.search(args);
      return { success: true, message: `Searching: "${args}"` };
    }

    case "help": {
      ctx.showHelp();
      return { success: true, message: "" };
    }

    default:
      return { success: false, message: `Unknown command: ${cmd}` };
  }
}
