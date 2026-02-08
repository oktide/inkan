import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import { Board } from "./components/Board.js";
import { CommandBar } from "./components/CommandBar.js";
import { TaskDetail } from "./components/TaskDetail.js";
import { HelpBar } from "./components/HelpBar.js";
import { useBoard } from "./hooks/useBoard.js";
import { useNavigation } from "./hooks/useNavigation.js";
import { executeCommand } from "./commands.js";
import { loadBoard } from "./storage.js";
export function App() {
    const { exit } = useApp();
    const boardActions = useBoard(loadBoard());
    const { board, searchQuery } = boardActions;
    const nav = useNavigation(board);
    const [mode, setMode] = useState("board");
    const [showHelp, setShowHelp] = useState(false);
    const [commandFeedback, setCommandFeedback] = useState("");
    const [detailTaskId, setDetailTaskId] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [waitingForMove, setWaitingForMove] = useState(false);
    // Quick-add mode
    const [quickAdd, setQuickAdd] = useState(false);
    const [quickAddValue, setQuickAddValue] = useState("");
    // Re-clamp navigation when board changes
    useEffect(() => {
        nav.ensureValid();
    }, [board.columns]);
    const openEditTask = useCallback((taskId) => {
        setDetailTaskId(taskId);
        setMode("detail");
    }, []);
    const showHelpOverlay = useCallback(() => {
        setShowHelp(true);
    }, []);
    useInput((input, key) => {
        // Command bar mode handles its own input via TextInput
        if (mode === "command") {
            if (key.escape) {
                setMode("board");
                setCommandFeedback("");
            }
            return;
        }
        // Detail mode handles its own input
        if (mode === "detail")
            return;
        // Confirm mode
        if (mode === "confirm") {
            if (input === "y" && confirmAction) {
                confirmAction();
                setMode("board");
                setConfirmAction(null);
                setConfirmMessage("");
            }
            else if (input === "n" || key.escape) {
                setMode("board");
                setConfirmAction(null);
                setConfirmMessage("");
            }
            return;
        }
        // Quick-add mode is handled by TextInput
        if (quickAdd) {
            if (key.escape) {
                setQuickAdd(false);
                setQuickAddValue("");
            }
            return;
        }
        // Board mode - waiting for move direction
        if (waitingForMove) {
            setWaitingForMove(false);
            if (!nav.currentTaskId || !nav.currentColumn)
                return;
            const taskId = nav.currentTaskId;
            const fromCol = nav.currentColumn;
            if (input === "h" || key.leftArrow) {
                const idx = board.columns.findIndex((c) => c.id === fromCol.id);
                if (idx > 0) {
                    const toCol = board.columns[idx - 1];
                    boardActions.moveTask(taskId, fromCol.id, toCol.id);
                    nav.moveLeft();
                }
            }
            else if (input === "l" || key.rightArrow) {
                const idx = board.columns.findIndex((c) => c.id === fromCol.id);
                if (idx < board.columns.length - 1) {
                    const toCol = board.columns[idx + 1];
                    boardActions.moveTask(taskId, fromCol.id, toCol.id);
                    nav.moveRight();
                }
            }
            return;
        }
        // Board mode - normal navigation
        if (input === "q") {
            exit();
            return;
        }
        if (input === "?") {
            setShowHelp((h) => !h);
            return;
        }
        if (input === "/") {
            setMode("command");
            setCommandFeedback("");
            return;
        }
        if (input === "h" || key.leftArrow) {
            nav.moveLeft();
        }
        else if (input === "l" || key.rightArrow) {
            nav.moveRight();
        }
        else if (input === "k" || key.upArrow) {
            nav.moveUp();
        }
        else if (input === "j" || key.downArrow) {
            nav.moveDown();
        }
        else if (key.return) {
            if (nav.currentTaskId) {
                setDetailTaskId(nav.currentTaskId);
                setMode("detail");
            }
        }
        else if (input === "n") {
            setQuickAdd(true);
            setQuickAddValue("");
        }
        else if (input === "d") {
            if (nav.currentTaskId && nav.currentColumn) {
                const task = board.tasks[nav.currentTaskId];
                if (task) {
                    const taskId = nav.currentTaskId;
                    setConfirmMessage(`Delete "${task.title}"?`);
                    setConfirmAction(() => () => boardActions.deleteTask(taskId));
                    setMode("confirm");
                }
            }
        }
        else if (input === "m") {
            if (nav.currentTaskId) {
                setWaitingForMove(true);
            }
        }
    });
    function handleCommandSubmit(input) {
        const result = executeCommand(input, {
            board,
            currentColumnId: nav.currentColumn?.id ?? board.columns[0]?.id ?? "",
            addTask: boardActions.addTask,
            deleteTask: boardActions.deleteTask,
            moveTask: boardActions.moveTask,
            addColumn: boardActions.addColumn,
            removeColumn: boardActions.removeColumn,
            search: boardActions.search,
            clearSearch: boardActions.clearSearch,
            openEditTask,
            showHelp: showHelpOverlay,
        });
        if (result.message) {
            setCommandFeedback(result.message);
        }
        if (result.success) {
            // Small delay before closing command bar on success
            setTimeout(() => {
                setMode("board");
                setCommandFeedback("");
            }, 800);
        }
    }
    function handleQuickAddSubmit(val) {
        if (val.trim() && nav.currentColumn) {
            boardActions.addTask(nav.currentColumn.id, val.trim());
        }
        setQuickAdd(false);
        setQuickAddValue("");
    }
    const detailTask = detailTaskId ? board.tasks[detailTaskId] : null;
    return (_jsxs(Box, { flexDirection: "column", height: "100%", children: [_jsxs(Box, { paddingX: 1, justifyContent: "space-between", children: [_jsx(Text, { bold: true, color: "magenta", children: "inkan" }), _jsx(Text, { dimColor: true, children: board.name }), searchQuery && (_jsxs(Text, { color: "yellow", children: ["Search: \"", searchQuery, "\""] })), waitingForMove && (_jsx(Text, { color: "yellow", bold: true, children: "Move: press h/l for direction" }))] }), mode === "detail" && detailTask ? (_jsx(TaskDetail, { task: detailTask, onSave: (updates) => {
                    boardActions.editTask(detailTaskId, updates);
                }, onClose: () => {
                    setMode("board");
                    setDetailTaskId(null);
                } })) : (_jsx(Board, { board: board, columnIndex: nav.columnIndex, taskIndex: nav.taskIndex, searchQuery: searchQuery })), mode === "confirm" && (_jsxs(Box, { paddingX: 1, borderStyle: "single", borderColor: "red", children: [_jsx(Text, { color: "red", bold: true, children: confirmMessage }), _jsx(Text, { children: " (y/n)" })] })), quickAdd && (_jsxs(Box, { paddingX: 1, borderStyle: "single", borderColor: "green", children: [_jsx(Text, { color: "green", children: "New task: " }), _jsx(QuickAddInput, { value: quickAddValue, onChange: setQuickAddValue, onSubmit: handleQuickAddSubmit })] })), mode === "command" && (_jsx(CommandBar, { onSubmit: handleCommandSubmit, onCancel: () => {
                    setMode("board");
                    setCommandFeedback("");
                }, feedback: commandFeedback })), _jsx(HelpBar, { mode: mode, showFullHelp: showHelp })] }));
}
// Separate component to isolate TextInput
function QuickAddInput({ value, onChange, onSubmit, }) {
    return _jsx(TextInput, { value: value, onChange: onChange, onSubmit: onSubmit });
}
