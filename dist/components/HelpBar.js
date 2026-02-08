import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
const FULL_HELP = [
    ["h/\u2190", "Move left"],
    ["l/\u2192", "Move right"],
    ["k/\u2191", "Move up"],
    ["j/\u2193", "Move down"],
    ["Enter", "Open task"],
    ["n", "New task"],
    ["d", "Delete task"],
    ["m+h/l", "Move task"],
    ["/", "Command bar"],
    ["?", "Toggle help"],
    ["q", "Quit"],
    ["", ""],
    ["/new <title>", "Create task"],
    ["/move <title> <col>", "Move task"],
    ["/delete <title>", "Delete task"],
    ["/edit <title>", "Edit task"],
    ["/col add <name>", "Add column"],
    ["/col rm <name>", "Remove column"],
    ["/search <query>", "Filter tasks"],
    ["/help", "Show help"],
];
export function HelpBar({ mode, showFullHelp }) {
    if (showFullHelp) {
        return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "green", paddingX: 1, children: [_jsx(Text, { bold: true, color: "green", children: "Keybindings & Commands" }), FULL_HELP.map(([key, desc], i) => key ? (_jsxs(Box, { gap: 1, children: [_jsx(Text, { color: "yellow", bold: true, children: key.padEnd(22) }), _jsx(Text, { children: desc })] }, i)) : (_jsx(Text, { children: " " }, i))), _jsx(Text, { dimColor: true, children: "Press ? to close" })] }));
    }
    const hints = {
        board: "hjkl:nav  n:new  d:del  m+h/l:move  Enter:detail  /:cmd  ?:help  q:quit",
        command: "Enter:run  Esc:cancel",
        detail: "j/k:nav  Enter/e:edit  Esc/q:close",
        confirm: "y:confirm  n/Esc:cancel",
    };
    return (_jsx(Box, { paddingX: 1, children: _jsx(Text, { dimColor: true, children: hints[mode] }) }));
}
