import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import type { Task } from "../types.js";
import { loadTaskBody } from "../storage.js";

interface TaskDrawerProps {
  task: Task;
  fullWidth: boolean;
  showMeta?: boolean;
}

function renderMarkdown(md: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marked.setOptions({ renderer: new TerminalRenderer() as any });
  return marked.parse(md, { async: false }).trim();
}

export function TaskDrawer({ task, fullWidth, showMeta = true }: TaskDrawerProps) {
  const [body, setBody] = useState("");

  useEffect(() => {
    setBody(loadTaskBody(task.id));
  }, [task.id]);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="magenta"
      paddingX={1}
      paddingY={1}
      overflowX="hidden"
      {...(fullWidth ? { flexGrow: 1 } : { width: 50, flexShrink: 0 })}
    >
      {showMeta && (
        <>
          <Text bold color="magenta">
            {task.title}
          </Text>
          {task.priority && <Text dimColor>Priority: {task.priority}</Text>}
          {task.dueDate && <Text dimColor>Due: {task.dueDate}</Text>}
          {task.tags && task.tags.length > 0 && (
            <Text dimColor>Tags: {task.tags.join(", ")}</Text>
          )}
          <Text dimColor>{"─".repeat(fullWidth ? 40 : 46)}</Text>
        </>
      )}
      {body ? (
        <Text>{renderMarkdown(body)}</Text>
      ) : (
        <Text dimColor italic>
          (no body)
        </Text>
      )}
    </Box>
  );
}
