import React from "react";
import { Box, Text } from "ink";
import type { Task } from "../types.js";

interface CardProps {
  task: Task;
  selected: boolean;
}

const priorityColors: Record<string, string> = {
  high: "red",
  medium: "yellow",
  low: "green",
};

export function Card({ task, selected }: CardProps) {
  const priorityColor = task.priority ? priorityColors[task.priority] : undefined;

  return (
    <Box
      paddingX={1}
      borderStyle={selected ? "bold" : undefined}
      borderColor={selected ? "cyan" : undefined}
    >
      <Box flexDirection="column" flexGrow={1}>
        <Text bold={selected} color={selected ? "cyan" : undefined}>
          {task.title}
        </Text>
        <Box gap={1}>
          {task.priority && (
            <Text color={priorityColor} dimColor={!selected}>
              [{task.priority}]
            </Text>
          )}
          {task.dueDate && (
            <Text dimColor>{task.dueDate.slice(0, 10)}</Text>
          )}
          {task.tags && task.tags.length > 0 && (
            <Text dimColor>
              {task.tags.map((t) => `#${t}`).join(" ")}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}
