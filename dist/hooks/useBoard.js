import { useReducer, useCallback } from "react";
import { nanoid } from "nanoid";
import { saveBoard, deleteTaskBody } from "../storage.js";
function reducer(state, action) {
    const { board } = state;
    switch (action.type) {
        case "ADD_TASK": {
            const now = new Date().toISOString();
            const id = nanoid(8);
            const task = {
                id,
                title: action.title,
                createdAt: now,
                updatedAt: now,
            };
            const newBoard = {
                ...board,
                tasks: { ...board.tasks, [id]: task },
                columns: board.columns.map((col) => col.id === action.columnId
                    ? { ...col, taskIds: [...col.taskIds, id] }
                    : col),
            };
            saveBoard(newBoard);
            return { ...state, board: newBoard };
        }
        case "DELETE_TASK": {
            const { [action.taskId]: _, ...remainingTasks } = board.tasks;
            const newBoard = {
                ...board,
                tasks: remainingTasks,
                columns: board.columns.map((col) => ({
                    ...col,
                    taskIds: col.taskIds.filter((id) => id !== action.taskId),
                })),
            };
            saveBoard(newBoard);
            deleteTaskBody(action.taskId);
            return { ...state, board: newBoard };
        }
        case "MOVE_TASK": {
            const newBoard = {
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
            };
            saveBoard(newBoard);
            return { ...state, board: newBoard };
        }
        case "EDIT_TASK": {
            const existing = board.tasks[action.taskId];
            if (!existing)
                return state;
            const updated = {
                ...existing,
                ...action.updates,
                updatedAt: new Date().toISOString(),
            };
            const newBoard = {
                ...board,
                tasks: { ...board.tasks, [action.taskId]: updated },
            };
            saveBoard(newBoard);
            return { ...state, board: newBoard };
        }
        case "ADD_COLUMN": {
            const id = nanoid(8);
            const newBoard = {
                ...board,
                columns: [...board.columns, { id, name: action.name, taskIds: [] }],
            };
            saveBoard(newBoard);
            return { ...state, board: newBoard };
        }
        case "REMOVE_COLUMN": {
            const col = board.columns.find((c) => c.id === action.columnId);
            if (!col || col.taskIds.length > 0)
                return state;
            const newBoard = {
                ...board,
                columns: board.columns.filter((c) => c.id !== action.columnId),
            };
            saveBoard(newBoard);
            return { ...state, board: newBoard };
        }
        case "SEARCH":
            return { ...state, searchQuery: action.query };
        case "CLEAR_SEARCH":
            return { ...state, searchQuery: "" };
        default:
            return state;
    }
}
export function useBoard(initialBoard) {
    const [state, dispatch] = useReducer(reducer, {
        board: initialBoard,
        searchQuery: "",
    });
    const addTask = useCallback((columnId, title) => {
        dispatch({ type: "ADD_TASK", columnId, title });
    }, []);
    const deleteTask = useCallback((taskId) => {
        dispatch({ type: "DELETE_TASK", taskId });
    }, []);
    const moveTask = useCallback((taskId, fromColumnId, toColumnId) => {
        dispatch({ type: "MOVE_TASK", taskId, fromColumnId, toColumnId });
    }, []);
    const editTask = useCallback((taskId, updates) => {
        dispatch({ type: "EDIT_TASK", taskId, updates });
    }, []);
    const addColumn = useCallback((name) => {
        dispatch({ type: "ADD_COLUMN", name });
    }, []);
    const removeColumn = useCallback((columnId) => {
        dispatch({ type: "REMOVE_COLUMN", columnId });
    }, []);
    const search = useCallback((query) => {
        dispatch({ type: "SEARCH", query });
    }, []);
    const clearSearch = useCallback(() => {
        dispatch({ type: "CLEAR_SEARCH" });
    }, []);
    return {
        board: state.board,
        searchQuery: state.searchQuery,
        addTask,
        deleteTask,
        moveTask,
        editTask,
        addColumn,
        removeColumn,
        search,
        clearSearch,
    };
}
