import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { execSync } from "node:child_process";
import TextInput from "ink-text-input";
import { loadTaskBody, saveTaskBody, taskBodyPath } from "../storage.js";
const FIELDS = ["title", "body", "priority", "dueDate", "tags"];
const FIELD_LABELS = {
    title: "Title",
    body: "Body",
    priority: "Priority (low/medium/high)",
    dueDate: "Due Date (YYYY-MM-DD)",
    tags: "Tags (comma-separated)",
};
export function TaskDetail({ task, onSave, onClose }) {
    const [fieldIndex, setFieldIndex] = useState(0);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const [body, setBody] = useState("");
    const currentField = FIELDS[fieldIndex];
    useEffect(() => {
        setBody(loadTaskBody(task.id));
    }, [task.id]);
    function getFieldValue(field) {
        switch (field) {
            case "title": return task.title;
            case "body": return body;
            case "priority": return task.priority ?? "";
            case "dueDate": return task.dueDate ?? "";
            case "tags": return task.tags?.join(", ") ?? "";
        }
    }
    function bodyPreview() {
        if (!body)
            return "(empty — press Enter to edit in $EDITOR)";
        const lines = body.split("\n").filter(Boolean);
        const preview = lines.slice(0, 3).join(" | ");
        return lines.length > 3 ? preview + " ..." : preview;
    }
    useInput((input, key) => {
        if (editing) {
            if (key.escape) {
                setEditing(false);
            }
            return;
        }
        if (key.escape || input === "q") {
            onClose();
            return;
        }
        if (input === "j" || key.downArrow) {
            setFieldIndex((i) => Math.min(i + 1, FIELDS.length - 1));
        }
        else if (input === "k" || key.upArrow) {
            setFieldIndex((i) => Math.max(i - 1, 0));
        }
        else if (key.return || input === "e") {
            if (currentField === "body") {
                openBodyInEditor();
            }
            else {
                setEditValue(getFieldValue(currentField));
                setEditing(true);
            }
        }
    });
    function openBodyInEditor() {
        const editor = process.env.EDITOR || process.env.VISUAL || "vi";
        const filePath = taskBodyPath(task.id);
        // Ensure file exists before opening
        saveTaskBody(task.id, body);
        try {
            execSync(`${editor} "${filePath}"`, { stdio: "inherit" });
            // Reload body after editor closes
            setBody(loadTaskBody(task.id));
        }
        catch {
            // editor may have exited abnormally, still try to reload
            setBody(loadTaskBody(task.id));
        }
    }
    function handleSubmit(val) {
        const updates = {};
        switch (currentField) {
            case "title":
                if (val.trim())
                    updates.title = val.trim();
                break;
            case "priority":
                if (["low", "medium", "high"].includes(val.trim().toLowerCase())) {
                    updates.priority = val.trim().toLowerCase();
                }
                else if (!val.trim()) {
                    updates.priority = undefined;
                }
                break;
            case "dueDate":
                updates.dueDate = val.trim() || undefined;
                break;
            case "tags":
                updates.tags = val.trim()
                    ? val.split(",").map((t) => t.trim()).filter(Boolean)
                    : undefined;
                break;
        }
        onSave(updates);
        setEditing(false);
    }
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "double", borderColor: "cyan", paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Task Detail" }), _jsxs(Text, { dimColor: true, children: ["Created: ", task.createdAt.slice(0, 10), " | Updated: ", task.updatedAt.slice(0, 10)] }), _jsxs(Text, { dimColor: true, children: ["File: ", taskBodyPath(task.id)] }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: FIELDS.map((field, idx) => {
                    const selected = idx === fieldIndex;
                    const isEditing = selected && editing;
                    if (field === "body") {
                        return (_jsx(Box, { paddingX: 1, flexDirection: "column", children: _jsxs(Text, { color: selected ? "cyan" : undefined, bold: selected, children: [selected ? "> " : "  ", FIELD_LABELS[field], ":", " ", _jsx(Text, { children: bodyPreview() })] }) }, field));
                    }
                    const value = getFieldValue(field);
                    return (_jsxs(Box, { paddingX: 1, children: [_jsxs(Text, { color: selected ? "cyan" : undefined, bold: selected, children: [selected ? "> " : "  ", FIELD_LABELS[field], ":", " "] }), isEditing ? (_jsx(TextInput, { value: editValue, onChange: setEditValue, onSubmit: handleSubmit })) : (_jsx(Text, { children: value || "(empty)" }))] }, field));
                }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "j/k: navigate | Enter/e: edit (opens $EDITOR for body) | Esc/q: close" }) })] }));
}
