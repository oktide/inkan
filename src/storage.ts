import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { nanoid } from "nanoid";
import type { Board, AppData, Wall } from "./types.js";

const CONFIG_DIR = path.join(os.homedir(), ".config", "inkan");
const BOARD_FILE = path.join(CONFIG_DIR, "board.json");
const TASKS_DIR = path.join(CONFIG_DIR, "tasks");

function defaultBoard(): Board {
  return {
    id: nanoid(8),
    name: "My Board",
    columns: [
      { id: "todo", name: "Todo", taskIds: [] },
      { id: "in-progress", name: "In Progress", taskIds: [] },
      { id: "done", name: "Done", taskIds: [] },
    ],
    tasks: {},
  };
}

function defaultAppData(): AppData {
  const board = defaultBoard();
  const wall: Wall = {
    id: nanoid(8),
    name: "Default",
    boards: [board],
  };
  return {
    version: 2,
    walls: [wall],
    activeWallId: wall.id,
    activeBoardId: board.id,
  };
}

function isLegacyBoard(data: unknown): data is { name?: string; columns: unknown[]; tasks: Record<string, unknown> } {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.columns) && typeof obj.tasks === "object" && !("version" in obj);
}

function migrateFromLegacy(legacy: { name?: string; columns: unknown[]; tasks: Record<string, unknown> }): AppData {
  const board: Board = {
    id: nanoid(8),
    name: (legacy.name as string) || "My Board",
    columns: legacy.columns as Board["columns"],
    tasks: legacy.tasks as Board["tasks"],
  };
  const wall: Wall = {
    id: nanoid(8),
    name: "Default",
    boards: [board],
  };
  return {
    version: 2,
    walls: [wall],
    activeWallId: wall.id,
    activeBoardId: board.id,
  };
}

export function loadAppData(): AppData {
  try {
    const raw = fs.readFileSync(BOARD_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (isLegacyBoard(data)) {
      const appData = migrateFromLegacy(data);
      saveAppData(appData);
      return appData;
    }
    return data as AppData;
  } catch {
    const appData = defaultAppData();
    saveAppData(appData);
    return appData;
  }
}

export function saveAppData(data: AppData): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(BOARD_FILE, JSON.stringify(data, null, 2));
}

export function taskBodyPath(taskId: string): string {
  return path.join(TASKS_DIR, `${taskId}.md`);
}

export function loadTaskBody(taskId: string): string {
  try {
    return fs.readFileSync(taskBodyPath(taskId), "utf-8");
  } catch {
    return "";
  }
}

export function saveTaskBody(taskId: string, content: string): void {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
  fs.writeFileSync(taskBodyPath(taskId), content);
}

export function deleteTaskBody(taskId: string): void {
  try {
    fs.unlinkSync(taskBodyPath(taskId));
  } catch {
    // file may not exist, that's fine
  }
}
