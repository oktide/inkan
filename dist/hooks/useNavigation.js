import { useState, useCallback } from "react";
export function useNavigation(board) {
    const [columnIndex, setColumnIndex] = useState(0);
    const [taskIndex, setTaskIndex] = useState(0);
    const clampColumn = useCallback((idx) => Math.max(0, Math.min(idx, board.columns.length - 1)), [board.columns.length]);
    const clampTask = useCallback((colIdx, tIdx) => {
        const col = board.columns[colIdx];
        if (!col || col.taskIds.length === 0)
            return 0;
        return Math.max(0, Math.min(tIdx, col.taskIds.length - 1));
    }, [board.columns]);
    const moveLeft = useCallback(() => {
        setColumnIndex((prev) => {
            const next = clampColumn(prev - 1);
            setTaskIndex((ti) => clampTask(next, ti));
            return next;
        });
    }, [clampColumn, clampTask]);
    const moveRight = useCallback(() => {
        setColumnIndex((prev) => {
            const next = clampColumn(prev + 1);
            setTaskIndex((ti) => clampTask(next, ti));
            return next;
        });
    }, [clampColumn, clampTask]);
    const moveUp = useCallback(() => {
        setTaskIndex((prev) => Math.max(0, prev - 1));
    }, []);
    const moveDown = useCallback(() => {
        setTaskIndex((prev) => {
            const col = board.columns[columnIndex];
            if (!col || col.taskIds.length === 0)
                return 0;
            return Math.min(prev + 1, col.taskIds.length - 1);
        });
    }, [board.columns, columnIndex]);
    // Re-clamp when board changes
    const ensureValid = useCallback(() => {
        setColumnIndex((ci) => {
            const clamped = clampColumn(ci);
            setTaskIndex((ti) => clampTask(clamped, ti));
            return clamped;
        });
    }, [clampColumn, clampTask]);
    const currentColumn = board.columns[columnIndex];
    const currentTaskId = currentColumn?.taskIds[taskIndex] ?? null;
    return {
        columnIndex,
        taskIndex,
        currentColumn,
        currentTaskId,
        moveLeft,
        moveRight,
        moveUp,
        moveDown,
        ensureValid,
        setColumnIndex,
        setTaskIndex,
    };
}
