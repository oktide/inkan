import { useReducer, useCallback } from "react";
import { nanoid } from "nanoid";
import type { Board, Task, AppData, Wall } from "../types.js";
import { saveAppData, deleteTaskBody } from "../storage.js";

type Action =
  | { type: "ADD_TASK"; columnId: string; title: string }
  | { type: "DELETE_TASK"; taskId: string }
  | { type: "MOVE_TASK"; taskId: string; fromColumnId: string; toColumnId: string }
  | { type: "MOVE_TASK_TO"; taskId: string; fromColumnId: string; targetWallId: string; targetBoardId: string; targetColumnId: string }
  | { type: "EDIT_TASK"; taskId: string; updates: Partial<Pick<Task, "title" | "priority" | "dueDate" | "tags">> }
  | { type: "ADD_COLUMN"; name: string }
  | { type: "REMOVE_COLUMN"; columnId: string }
  | { type: "SEARCH"; query: string }
  | { type: "CLEAR_SEARCH" }
  | { type: "ADD_WALL"; name: string }
  | { type: "SWITCH_WALL"; wallId: string }
  | { type: "DELETE_WALL"; wallId: string }
  | { type: "ADD_BOARD"; name: string }
  | { type: "SWITCH_BOARD"; boardId: string }
  | { type: "DELETE_BOARD"; boardId: string };

interface AppState {
  data: AppData;
  searchQuery: string;
}

function getActiveWall(data: AppData): Wall {
  return data.walls.find((w) => w.id === data.activeWallId) ?? data.walls[0]!;
}

function getActiveBoard(data: AppData): Board {
  const wall = getActiveWall(data);
  return wall.boards.find((b) => b.id === data.activeBoardId) ?? wall.boards[0]!;
}

function updateActiveBoard(data: AppData, updater: (board: Board) => Board): AppData {
  return {
    ...data,
    walls: data.walls.map((wall) =>
      wall.id === data.activeWallId
        ? {
            ...wall,
            boards: wall.boards.map((board) =>
              board.id === data.activeBoardId ? updater(board) : board
            ),
          }
        : wall
    ),
  };
}

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

function reducer(state: AppState, action: Action): AppState {
  const { data } = state;

  switch (action.type) {
    case "ADD_TASK": {
      const now = new Date().toISOString();
      const id = nanoid(8);
      const task: Task = {
        id,
        title: action.title,
        createdAt: now,
        updatedAt: now,
      };
      const newData = updateActiveBoard(data, (board) => ({
        ...board,
        tasks: { ...board.tasks, [id]: task },
        columns: board.columns.map((col) =>
          col.id === action.columnId
            ? { ...col, taskIds: [...col.taskIds, id] }
            : col
        ),
      }));
      saveAppData(newData);
      return { ...state, data: newData };
    }

    case "DELETE_TASK": {
      const newData = updateActiveBoard(data, (board) => {
        const { [action.taskId]: _, ...remainingTasks } = board.tasks;
        return {
          ...board,
          tasks: remainingTasks,
          columns: board.columns.map((col) => ({
            ...col,
            taskIds: col.taskIds.filter((id) => id !== action.taskId),
          })),
        };
      });
      saveAppData(newData);
      deleteTaskBody(action.taskId);
      return { ...state, data: newData };
    }

    case "MOVE_TASK": {
      const newData = updateActiveBoard(data, (board) => ({
        ...board,
        columns: board.columns.map((col) => {
          if (col.id === action.fromColumnId) {
            return { ...col, taskIds: col.taskIds.filter((id) => id !== action.taskId) };
          }
          if (col.id === action.toColumnId) {
            return { ...col, taskIds: [...col.taskIds, action.taskId] };
          }
          return col;
        }),
      }));
      saveAppData(newData);
      return { ...state, data: newData };
    }

    case "MOVE_TASK_TO": {
      const sourceBoard = getActiveBoard(data);
      const task = sourceBoard.tasks[action.taskId];
      if (!task) return state;

      const sameBoard = action.targetWallId === data.activeWallId && action.targetBoardId === data.activeBoardId;

      if (sameBoard) {
        const newData = updateActiveBoard(data, (board) => ({
          ...board,
          columns: board.columns.map((col) => {
            if (col.id === action.fromColumnId) {
              return { ...col, taskIds: col.taskIds.filter((id) => id !== action.taskId) };
            }
            if (col.id === action.targetColumnId) {
              return { ...col, taskIds: [...col.taskIds, action.taskId] };
            }
            return col;
          }),
        }));
        saveAppData(newData);
        return { ...state, data: newData };
      }

      // Cross-board move: remove from source board
      let newData = updateActiveBoard(data, (board) => {
        const { [action.taskId]: _, ...remainingTasks } = board.tasks;
        return {
          ...board,
          tasks: remainingTasks,
          columns: board.columns.map((col) => ({
            ...col,
            taskIds: col.taskIds.filter((id) => id !== action.taskId),
          })),
        };
      });

      // Add to target board
      newData = {
        ...newData,
        walls: newData.walls.map((wall) =>
          wall.id === action.targetWallId
            ? {
                ...wall,
                boards: wall.boards.map((board) =>
                  board.id === action.targetBoardId
                    ? {
                        ...board,
                        tasks: { ...board.tasks, [action.taskId]: task },
                        columns: board.columns.map((col) =>
                          col.id === action.targetColumnId
                            ? { ...col, taskIds: [...col.taskIds, action.taskId] }
                            : col
                        ),
                      }
                    : board
                ),
              }
            : wall
        ),
      };
      saveAppData(newData);
      return { ...state, data: newData };
    }

    case "EDIT_TASK": {
      const board = getActiveBoard(data);
      const existing = board.tasks[action.taskId];
      if (!existing) return state;
      const updated: Task = {
        ...existing,
        ...action.updates,
        updatedAt: new Date().toISOString(),
      };
      const newData = updateActiveBoard(data, (b) => ({
        ...b,
        tasks: { ...b.tasks, [action.taskId]: updated },
      }));
      saveAppData(newData);
      return { ...state, data: newData };
    }

    case "ADD_COLUMN": {
      const id = nanoid(8);
      const newData = updateActiveBoard(data, (board) => ({
        ...board,
        columns: [...board.columns, { id, name: action.name, taskIds: [] }],
      }));
      saveAppData(newData);
      return { ...state, data: newData };
    }

    case "REMOVE_COLUMN": {
      const board = getActiveBoard(data);
      const col = board.columns.find((c) => c.id === action.columnId);
      if (!col || col.taskIds.length > 0) return state;
      const newData = updateActiveBoard(data, (b) => ({
        ...b,
        columns: b.columns.filter((c) => c.id !== action.columnId),
      }));
      saveAppData(newData);
      return { ...state, data: newData };
    }

    case "SEARCH":
      return { ...state, searchQuery: action.query };

    case "CLEAR_SEARCH":
      return { ...state, searchQuery: "" };

    case "ADD_WALL": {
      const board = defaultBoard();
      const wall: Wall = {
        id: nanoid(8),
        name: action.name,
        boards: [board],
      };
      const newData: AppData = {
        ...data,
        walls: [...data.walls, wall],
        activeWallId: wall.id,
        activeBoardId: board.id,
      };
      saveAppData(newData);
      return { ...state, data: newData };
    }

    case "SWITCH_WALL": {
      const target = data.walls.find((w) => w.id === action.wallId);
      if (!target) return state;
      const newData: AppData = {
        ...data,
        activeWallId: target.id,
        activeBoardId: target.boards[0]?.id ?? data.activeBoardId,
      };
      saveAppData(newData);
      return { ...state, data: newData };
    }

    case "DELETE_WALL": {
      if (data.walls.length <= 1) return state;
      const wallToDelete = data.walls.find((w) => w.id === action.wallId);
      const remaining = data.walls.filter((w) => w.id !== action.wallId);
      // Clean up task body files for all tasks in the deleted wall
      if (wallToDelete) {
        for (const board of wallToDelete.boards) {
          for (const taskId of Object.keys(board.tasks)) {
            deleteTaskBody(taskId);
          }
        }
      }
      const needSwitch = data.activeWallId === action.wallId;
      const newData: AppData = {
        ...data,
        walls: remaining,
        activeWallId: needSwitch ? remaining[0]!.id : data.activeWallId,
        activeBoardId: needSwitch ? remaining[0]!.boards[0]!.id : data.activeBoardId,
      };
      saveAppData(newData);
      return { ...state, data: newData };
    }

    case "ADD_BOARD": {
      const board: Board = {
        id: nanoid(8),
        name: action.name,
        columns: [
          { id: nanoid(8), name: "Todo", taskIds: [] },
          { id: nanoid(8), name: "In Progress", taskIds: [] },
          { id: nanoid(8), name: "Done", taskIds: [] },
        ],
        tasks: {},
      };
      const newData: AppData = {
        ...data,
        walls: data.walls.map((wall) =>
          wall.id === data.activeWallId
            ? { ...wall, boards: [...wall.boards, board] }
            : wall
        ),
        activeBoardId: board.id,
      };
      saveAppData(newData);
      return { ...state, data: newData };
    }

    case "SWITCH_BOARD": {
      const wall = getActiveWall(data);
      const target = wall.boards.find((b) => b.id === action.boardId);
      if (!target) return state;
      const newData: AppData = {
        ...data,
        activeBoardId: target.id,
      };
      saveAppData(newData);
      return { ...state, data: newData };
    }

    case "DELETE_BOARD": {
      const wall = getActiveWall(data);
      if (wall.boards.length <= 1) return state;
      const boardToDelete = wall.boards.find((b) => b.id === action.boardId);
      // Clean up task body files
      if (boardToDelete) {
        for (const taskId of Object.keys(boardToDelete.tasks)) {
          deleteTaskBody(taskId);
        }
      }
      const remainingBoards = wall.boards.filter((b) => b.id !== action.boardId);
      const needSwitch = data.activeBoardId === action.boardId;
      const newData: AppData = {
        ...data,
        walls: data.walls.map((w) =>
          w.id === data.activeWallId
            ? { ...w, boards: remainingBoards }
            : w
        ),
        activeBoardId: needSwitch ? remainingBoards[0]!.id : data.activeBoardId,
      };
      saveAppData(newData);
      return { ...state, data: newData };
    }

    default:
      return state;
  }
}

export function useBoard(initialData: AppData) {
  const [state, dispatch] = useReducer(reducer, {
    data: initialData,
    searchQuery: "",
  });

  const activeWall = getActiveWall(state.data);
  const board = getActiveBoard(state.data);

  const addTask = useCallback((columnId: string, title: string) => {
    dispatch({ type: "ADD_TASK", columnId, title });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    dispatch({ type: "DELETE_TASK", taskId });
  }, []);

  const moveTask = useCallback((taskId: string, fromColumnId: string, toColumnId: string) => {
    dispatch({ type: "MOVE_TASK", taskId, fromColumnId, toColumnId });
  }, []);

  const moveTaskTo = useCallback((taskId: string, fromColumnId: string, targetWallId: string, targetBoardId: string, targetColumnId: string) => {
    dispatch({ type: "MOVE_TASK_TO", taskId, fromColumnId, targetWallId, targetBoardId, targetColumnId });
  }, []);

  const editTask = useCallback((taskId: string, updates: Partial<Pick<Task, "title" | "priority" | "dueDate" | "tags">>) => {
    dispatch({ type: "EDIT_TASK", taskId, updates });
  }, []);

  const addColumn = useCallback((name: string) => {
    dispatch({ type: "ADD_COLUMN", name });
  }, []);

  const removeColumn = useCallback((columnId: string) => {
    dispatch({ type: "REMOVE_COLUMN", columnId });
  }, []);

  const search = useCallback((query: string) => {
    dispatch({ type: "SEARCH", query });
  }, []);

  const clearSearch = useCallback(() => {
    dispatch({ type: "CLEAR_SEARCH" });
  }, []);

  const addWall = useCallback((name: string) => {
    dispatch({ type: "ADD_WALL", name });
  }, []);

  const switchWall = useCallback((wallId: string) => {
    dispatch({ type: "SWITCH_WALL", wallId });
  }, []);

  const deleteWall = useCallback((wallId: string) => {
    dispatch({ type: "DELETE_WALL", wallId });
  }, []);

  const addBoard = useCallback((name: string) => {
    dispatch({ type: "ADD_BOARD", name });
  }, []);

  const switchBoard = useCallback((boardId: string) => {
    dispatch({ type: "SWITCH_BOARD", boardId });
  }, []);

  const deleteBoard = useCallback((boardId: string) => {
    dispatch({ type: "DELETE_BOARD", boardId });
  }, []);

  return {
    board,
    activeWall,
    walls: state.data.walls,
    searchQuery: state.searchQuery,
    addTask,
    deleteTask,
    moveTask,
    moveTaskTo,
    editTask,
    addColumn,
    removeColumn,
    search,
    clearSearch,
    addWall,
    switchWall,
    deleteWall,
    addBoard,
    switchBoard,
    deleteBoard,
  };
}
