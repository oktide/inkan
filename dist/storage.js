import fs from "node:fs";
import path from "node:path";
import os from "node:os";
const CONFIG_DIR = path.join(os.homedir(), ".config", "inkan");
const BOARD_FILE = path.join(CONFIG_DIR, "board.json");
const TASKS_DIR = path.join(CONFIG_DIR, "tasks");
function defaultBoard() {
    return {
        name: "My Board",
        columns: [
            { id: "todo", name: "Todo", taskIds: [] },
            { id: "in-progress", name: "In Progress", taskIds: [] },
            { id: "done", name: "Done", taskIds: [] },
        ],
        tasks: {},
    };
}
export function loadBoard() {
    try {
        const data = fs.readFileSync(BOARD_FILE, "utf-8");
        return JSON.parse(data);
    }
    catch {
        const board = defaultBoard();
        saveBoard(board);
        return board;
    }
}
export function saveBoard(board) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(BOARD_FILE, JSON.stringify(board, null, 2));
}
export function taskBodyPath(taskId) {
    return path.join(TASKS_DIR, `${taskId}.md`);
}
export function loadTaskBody(taskId) {
    try {
        return fs.readFileSync(taskBodyPath(taskId), "utf-8");
    }
    catch {
        return "";
    }
}
export function saveTaskBody(taskId, content) {
    fs.mkdirSync(TASKS_DIR, { recursive: true });
    fs.writeFileSync(taskBodyPath(taskId), content);
}
export function deleteTaskBody(taskId) {
    try {
        fs.unlinkSync(taskBodyPath(taskId));
    }
    catch {
        // file may not exist, that's fine
    }
}
