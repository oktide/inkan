import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import TextInput from "ink-text-input";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import type { Task } from "../types.js";
import { loadTaskBody, taskBodyPath, appendTaskUpdate } from "../storage.js";

interface TaskDetailProps {
  task: Task;
  onSave: (updates: Partial<Pick<Task, "title" | "description" | "priority" | "dueDate" | "tags" | "subtasks">>) => void;
  onClose: () => void;
  onOpenSubtasks: () => void;
}

type Field = "title" | "description" | "priority" | "dueDate" | "tags";
const FIELDS: Field[] = ["title", "description", "priority", "dueDate", "tags"];
const FIELD_LABELS: Record<Field, string> = {
  title: "Title",
  description: "Description",
  priority: "Priority (low/medium/high)",
  dueDate: "Due Date (YYYY-MM-DD)",
  tags: "Tags (comma-separated)",
};

function renderMarkdown(md: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marked.setOptions({ renderer: new TerminalRenderer() as any });
  return marked.parse(md, { async: false }).trim();
}

export function TaskDetail({ task, onSave, onClose, onOpenSubtasks }: TaskDetailProps) {
  const [fieldIndex, setFieldIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    setBody(loadTaskBody(task.id));
  }, [task.id]);

  function getFieldValue(field: Field): string {
    switch (field) {
      case "title": return task.title;
      case "description": return task.description ?? "";
      case "priority": return task.priority ?? "";
      case "dueDate": return task.dueDate ?? "";
      case "tags": return task.tags?.join(", ") ?? "";
    }
  }

  function openBodyInEditor() {
    const editor = process.env.EDITOR || process.env.VISUAL || "vi";
    const filePath = taskBodyPath(task.id);
    try {
      execSync(`${editor} "${filePath}"`, { stdio: "inherit" });
    } catch {
      // editor may have exited abnormally
    }
    setBody(loadTaskBody(task.id));
  }

  function addUpdate() {
    const editor = process.env.EDITOR || process.env.VISUAL || "vi";
    const tmpFile = path.join(os.tmpdir(), `inkan-update-${task.id}-${Date.now()}.md`);
    fs.writeFileSync(tmpFile, "");
    try {
      execSync(`${editor} "${tmpFile}"`, { stdio: "inherit" });
      const content = fs.readFileSync(tmpFile, "utf-8").trim();
      if (content) {
        appendTaskUpdate(task.id, content);
        setBody(loadTaskBody(task.id));
      }
    } catch {
      // editor may have exited abnormally
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
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

    if (input === "s") {
      onOpenSubtasks();
      return;
    }

    if (input === "u") {
      addUpdate();
    } else if (input === "b") {
      openBodyInEditor();
    } else if (input === "j" || key.downArrow) {
      setFieldIndex((i) => Math.min(i + 1, FIELDS.length - 1));
    } else if (input === "k" || key.upArrow) {
      setFieldIndex((i) => Math.max(i - 1, 0));
    } else if (key.return || input === "e") {
      const currentField = FIELDS[fieldIndex]!;
      setEditValue(getFieldValue(currentField));
      setEditing(true);
    }
  });

  function handleSubmit(val: string) {
    const currentField = FIELDS[fieldIndex]!;
    const updates: Partial<Pick<Task, "title" | "description" | "priority" | "dueDate" | "tags">> = {};
    switch (currentField) {
      case "title":
        if (val.trim()) updates.title = val.trim();
        break;
      case "description":
        updates.description = val.trim() || undefined;
        break;
      case "priority":
        if (["low", "medium", "high"].includes(val.trim().toLowerCase())) {
          updates.priority = val.trim().toLowerCase() as "low" | "medium" | "high";
        } else if (!val.trim()) {
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

  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter((st) => st.done).length;

  return (
    <Box flexDirection="row" flexGrow={1}>
      {/* Left column: metadata */}
      <Box
        flexDirection="column"
        width="50%"
        borderStyle="double"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
      >
        <Text bold color="cyan">
          Task Detail
        </Text>
        <Text dimColor>
          Created: {new Date(task.createdAt).toLocaleDateString()} | Updated: {new Date(task.updatedAt).toLocaleDateString()}
        </Text>
        <Box marginTop={1} flexDirection="column">
          {FIELDS.map((field, idx) => {
            const selected = idx === fieldIndex;
            const isEditing = selected && editing;
            const value = getFieldValue(field);
            return (
              <Box key={field} paddingX={1}>
                <Text color={selected ? "cyan" : undefined} bold={selected}>
                  {selected ? "> " : "  "}
                  {FIELD_LABELS[field]}:{" "}
                </Text>
                {isEditing ? (
                  <TextInput
                    value={editValue}
                    onChange={setEditValue}
                    onSubmit={handleSubmit}
                  />
                ) : (
                  <Text>{value || "(empty)"}</Text>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Subtask summary */}
        <Box marginTop={1} paddingX={1}>
          {subtasks.length > 0 ? (
            <Text dimColor>
              Subtasks: {doneCount}/{subtasks.length} done (s to manage)
            </Text>
          ) : (
            <Text dimColor>No subtasks (s to add)</Text>
          )}
        </Box>

        <Box marginTop={1}>
          <Text dimColor>
            j/k: navigate | Enter/e: edit | s: subtasks | u: update | b: body | Esc/q: close
          </Text>
        </Box>
      </Box>

      {/* Right column: markdown body */}
      <Box
        flexDirection="column"
        width="50%"
        borderStyle="single"
        borderColor="magenta"
        paddingX={1}
        paddingY={1}
        overflowX="hidden"
      >
        {body ? (
          <Text>{renderMarkdown(body)}</Text>
        ) : (
          <Text dimColor italic>
            (no body — press b to edit)
          </Text>
        )}
      </Box>
    </Box>
  );
}
