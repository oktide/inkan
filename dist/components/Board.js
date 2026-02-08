import { jsx as _jsx } from "react/jsx-runtime";
import { Box } from "ink";
import { Column } from "./Column.js";
export function Board({ board, columnIndex, taskIndex, searchQuery }) {
    return (_jsx(Box, { flexDirection: "row", flexGrow: 1, children: board.columns.map((col, idx) => (_jsx(Column, { column: col, tasks: board.tasks, focused: idx === columnIndex, selectedTaskIndex: idx === columnIndex ? taskIndex : -1, searchQuery: searchQuery }, col.id))) }));
}
