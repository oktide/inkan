import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
const COMMANDS = [
    { name: "new", args: "<title>", desc: "Create task in current column" },
    { name: "move", args: "<title> <column>", desc: "Move task to column" },
    { name: "delete", args: "<title>", desc: "Delete a task" },
    { name: "edit", args: "<title>", desc: "Open task for editing" },
    { name: "col add", args: "<name>", desc: "Add a new column" },
    { name: "col rm", args: "<name>", desc: "Remove an empty column" },
    { name: "search", args: "<query>", desc: "Filter visible tasks" },
    { name: "help", args: "", desc: "Show all keybindings" },
];
export function CommandBar({ onSubmit, onCancel, feedback }) {
    const [value, setValue] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const matches = useMemo(() => {
        const typed = value.toLowerCase().split(/\s+/)[0] ?? "";
        if (!typed)
            return COMMANDS;
        return COMMANDS.filter((cmd) => cmd.name.startsWith(typed));
    }, [value]);
    const showSuggestions = !value.includes(" ") && matches.length > 0;
    useInput((input, key) => {
        if (showSuggestions) {
            if (key.upArrow) {
                setSelectedIndex((i) => Math.max(0, i - 1));
                return;
            }
            if (key.downArrow) {
                setSelectedIndex((i) => Math.min(matches.length - 1, i + 1));
                return;
            }
            if (key.tab) {
                const match = matches[selectedIndex];
                if (match) {
                    setValue(match.name + " ");
                    setSelectedIndex(0);
                }
                return;
            }
        }
    });
    function handleChange(val) {
        setValue(val);
        setSelectedIndex(0);
    }
    function handleSubmit(val) {
        // If suggestions are showing and user hits enter, autocomplete first
        if (showSuggestions && matches.length > 0 && !val.includes(" ")) {
            const match = matches[selectedIndex];
            if (match && match.name !== val) {
                setValue(match.name + " ");
                setSelectedIndex(0);
                return;
            }
        }
        onSubmit(val);
        setValue("");
    }
    return (_jsxs(Box, { flexDirection: "column", children: [showSuggestions && (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, children: [matches.map((cmd, idx) => {
                        const isSelected = idx === selectedIndex;
                        return (_jsxs(Box, { gap: 1, children: [_jsxs(Text, { color: isSelected ? "cyan" : "yellow", bold: isSelected, children: [isSelected ? ">" : " ", " /", cmd.name] }), cmd.args && _jsx(Text, { dimColor: true, children: cmd.args }), _jsxs(Text, { color: isSelected ? "white" : "gray", children: ["\u2014 ", cmd.desc] })] }, cmd.name));
                    }), _jsx(Text, { dimColor: true, italic: true, children: "\u2191\u2193 navigate  Tab autocomplete  Enter select" })] })), _jsxs(Box, { borderStyle: "single", borderColor: "yellow", paddingX: 1, children: [_jsx(Text, { color: "yellow", children: "/" }), _jsx(TextInput, { value: value, onChange: handleChange, onSubmit: handleSubmit }), feedback && (_jsx(Box, { marginLeft: 2, children: _jsx(Text, { dimColor: true, children: feedback }) }))] })] }));
}
