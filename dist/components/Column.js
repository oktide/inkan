import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { Card } from "./Card.js";
import { loadTaskBody } from "../storage.js";
export function Column({ column, tasks, focused, selectedTaskIndex, searchQuery }) {
    const filteredTaskIds = searchQuery
        ? column.taskIds.filter((id) => {
            const task = tasks[id];
            if (!task)
                return false;
            const q = searchQuery.toLowerCase();
            return (task.title.toLowerCase().includes(q) ||
                loadTaskBody(id).toLowerCase().includes(q) ||
                task.tags?.some((t) => t.toLowerCase().includes(q)));
        })
        : column.taskIds;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: focused ? "bold" : "single", borderColor: focused ? "cyan" : "gray", minWidth: 24, flexGrow: 1, flexBasis: 0, children: [_jsxs(Box, { paddingX: 1, justifyContent: "space-between", children: [_jsx(Text, { bold: true, color: focused ? "cyan" : undefined, children: column.name }), _jsxs(Text, { dimColor: true, children: ["(", filteredTaskIds.length, ")"] })] }), _jsxs(Box, { flexDirection: "column", children: [filteredTaskIds.map((taskId, idx) => {
                        const task = tasks[taskId];
                        if (!task)
                            return null;
                        return (_jsx(Card, { task: task, selected: focused && idx === selectedTaskIndex }, taskId));
                    }), filteredTaskIds.length === 0 && (_jsx(Box, { paddingX: 1, children: _jsx(Text, { dimColor: true, italic: true, children: searchQuery ? "No matches" : "Empty" }) }))] })] }));
}
