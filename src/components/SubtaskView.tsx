import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { nanoid } from "nanoid";
import type { Task, Subtask } from "../types.js";

interface SubtaskViewProps {
  task: Task;
  onSave: (updates: Partial<Pick<Task, "subtasks">>) => void;
  onClose: () => void;
}

export function SubtaskView({ task, onSave, onClose }: SubtaskViewProps) {
  const subtasks = task.subtasks ?? [];
  const [cursorIndex, setCursorIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const subtasksRef = React.useRef(subtasks);
  subtasksRef.current = subtasks;

  function saveSubtasks(updated: Subtask[]) {
    onSave({ subtasks: updated.length > 0 ? updated : undefined });
  }

  useInput((input, key) => {
    if (adding) {
      if (key.escape) {
        setAdding(false);
        setAddValue("");
      }
      return;
    }

    if (editing) {
      if (key.escape) {
        setEditing(false);
        setEditValue("");
      }
      return;
    }

    if (key.escape || input === "q") {
      onClose();
      return;
    }

    const sts = subtasksRef.current;

    if (input === "j" || key.downArrow) {
      setCursorIndex((i) => Math.min(i + 1, sts.length - 1));
    } else if (input === "k" || key.upArrow) {
      setCursorIndex((i) => Math.max(i - 1, 0));
    } else if (input === " ") {
      if (cursorIndex >= 0 && cursorIndex < sts.length) {
        const updated = sts.map((st, idx) =>
          idx === cursorIndex ? { ...st, done: !st.done } : st
        );
        saveSubtasks(updated);
      }
    } else if (input === "d") {
      if (cursorIndex >= 0 && cursorIndex < sts.length) {
        const updated = sts.filter((_, idx) => idx !== cursorIndex);
        saveSubtasks(updated);
        if (cursorIndex >= updated.length && updated.length > 0) {
          setCursorIndex(updated.length - 1);
        }
      }
    } else if (input === "n") {
      setAddValue("");
      setAdding(true);
    } else if (key.return || input === "e") {
      if (cursorIndex >= 0 && cursorIndex < sts.length) {
        setEditValue(sts[cursorIndex]!.title);
        setEditing(true);
      }
    } else if (input === "J") {
      // Reorder down
      if (cursorIndex >= 0 && cursorIndex < sts.length - 1) {
        const updated = [...sts];
        [updated[cursorIndex], updated[cursorIndex + 1]] = [updated[cursorIndex + 1]!, updated[cursorIndex]!];
        saveSubtasks(updated);
        setCursorIndex(cursorIndex + 1);
      }
    } else if (input === "K") {
      // Reorder up
      if (cursorIndex > 0 && cursorIndex < sts.length) {
        const updated = [...sts];
        [updated[cursorIndex - 1], updated[cursorIndex]] = [updated[cursorIndex]!, updated[cursorIndex - 1]!];
        saveSubtasks(updated);
        setCursorIndex(cursorIndex - 1);
      }
    }
  });

  function handleAddSubmit(val: string) {
    if (val.trim()) {
      const newSubtask: Subtask = {
        id: nanoid(8),
        title: val.trim(),
        done: false,
      };
      const updated = [...subtasks, newSubtask];
      saveSubtasks(updated);
      setCursorIndex(updated.length - 1);
    }
    setAdding(false);
    setAddValue("");
  }

  function handleEditSubmit(val: string) {
    if (val.trim() && cursorIndex >= 0 && cursorIndex < subtasks.length) {
      const updated = subtasks.map((st, i) =>
        i === cursorIndex ? { ...st, title: val.trim() } : st
      );
      saveSubtasks(updated);
    }
    setEditing(false);
    setEditValue("");
  }

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Text bold color="cyan">
        Subtasks: "{task.title}"
      </Text>
      <Box marginTop={1} flexDirection="column">
        {subtasks.length === 0 && !adding && (
          <Text dimColor>  No subtasks yet. Press n to add one.</Text>
        )}
        {subtasks.map((st, idx) => {
          const selected = idx === cursorIndex;
          const isEditing = selected && editing;
          const checkbox = st.done ? "[x]" : "[ ]";
          return (
            <Box key={st.id} paddingX={1}>
              {isEditing ? (
                <>
                  <Text color="cyan" bold>
                    {">"} {checkbox}{" "}
                  </Text>
                  <TextInput
                    value={editValue}
                    onChange={setEditValue}
                    onSubmit={handleEditSubmit}
                  />
                </>
              ) : (
                <Text
                  color={selected ? "cyan" : undefined}
                  bold={selected}
                  strikethrough={st.done}
                >
                  {selected ? ">" : " "} {checkbox} {st.title}
                </Text>
              )}
            </Box>
          );
        })}
        {adding && (
          <Box paddingX={1}>
            <Text color="cyan" bold>{"  [ ] "}</Text>
            <TextInput
              value={addValue}
              onChange={setAddValue}
              onSubmit={handleAddSubmit}
            />
          </Box>
        )}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          n: add | Space: toggle | d: delete | e: edit | J/K: reorder | Esc: back
        </Text>
      </Box>
    </Box>
  );
}
