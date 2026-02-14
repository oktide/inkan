import React from "react";
import { withFullScreen } from "fullscreen-ink";
import { nanoid } from "nanoid";
import { App } from "./App.js";
import { loadAppData, saveAppData } from "./storage.js";
import { gitPush } from "./git.js";
import type { Task } from "./types.js";

const args = process.argv.slice(2);
const nIndex = args.indexOf("-n");

if (nIndex !== -1) {
  const titleParts = args.slice(nIndex + 1);
  if (titleParts.length === 0) {
    console.error("Usage: inkan -n <task title>");
    process.exit(1);
  }
  const title = titleParts.join(" ");
  const appData = loadAppData();
  const wall = appData.walls.find(w => w.id === appData.activeWallId) ?? appData.walls[0];
  const board = wall.boards.find(b => b.id === appData.activeBoardId) ?? wall.boards[0];
  const now = new Date().toISOString();
  const task: Task = {
    id: nanoid(8),
    title,
    createdAt: now,
    updatedAt: now,
  };
  board.tasks[task.id] = task;
  board.columns[0].taskIds.push(task.id);
  saveAppData(appData);
  gitPush();
  console.log(`Added "${title}" to ${board.columns[0].name}`);
  process.exit(0);
} else {
  // Synchronous fallback: ensure alternate screen buffer is exited
  // even if the process terminates before the async cleanup in
  // fullscreen-ink completes.
  process.on("exit", () => {
    process.stdout.write("\x1b[?1049l");
  });
  withFullScreen(<App />).start();
}
