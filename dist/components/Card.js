import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
const priorityColors = {
    high: "red",
    medium: "yellow",
    low: "green",
};
export function Card({ task, selected }) {
    const priorityColor = task.priority ? priorityColors[task.priority] : undefined;
    return (_jsx(Box, { paddingX: 1, borderStyle: selected ? "bold" : undefined, borderColor: selected ? "cyan" : undefined, children: _jsxs(Box, { flexDirection: "column", flexGrow: 1, children: [_jsx(Text, { bold: selected, color: selected ? "cyan" : undefined, children: task.title }), _jsxs(Box, { gap: 1, children: [task.priority && (_jsxs(Text, { color: priorityColor, dimColor: !selected, children: ["[", task.priority, "]"] })), task.dueDate && (_jsx(Text, { dimColor: true, children: task.dueDate.slice(0, 10) })), task.tags && task.tags.length > 0 && (_jsx(Text, { dimColor: true, children: task.tags.map((t) => `#${t}`).join(" ") }))] })] }) }));
}
