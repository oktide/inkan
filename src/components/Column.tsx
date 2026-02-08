import React from "react";
import { Box, Text } from "ink";
import type { Column as ColumnType, Task } from "../types.js";
import { Card } from "./Card.js";
import { loadTaskBody } from "../storage.js";

interface ColumnProps {
  column: ColumnType;
  tasks: Record<string, Task>;
  focused: boolean;
  selectedTaskIndex: number;
  searchQuery: string;
}

export function Column({ column, tasks, focused, selectedTaskIndex, searchQuery }: ColumnProps) {
  const filteredTaskIds = searchQuery
    ? column.taskIds.filter((id) => {
        const task = tasks[id];
        if (!task) return false;
        const q = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(q) ||
          loadTaskBody(id).toLowerCase().includes(q) ||
          task.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
    : column.taskIds;

  return (
    <Box
      flexDirection="column"
      borderStyle={focused ? "bold" : "single"}
      borderColor={focused ? "cyan" : "gray"}
      minWidth={24}
      flexGrow={1}
      flexBasis={0}
    >
      <Box paddingX={1} justifyContent="space-between">
        <Text bold color={focused ? "cyan" : undefined}>
          {column.name}
        </Text>
        <Text dimColor>({filteredTaskIds.length})</Text>
      </Box>

      <Box flexDirection="column">
        {filteredTaskIds.map((taskId, idx) => {
          const task = tasks[taskId];
          if (!task) return null;
          return (
            <Card
              key={taskId}
              task={task}
              selected={focused && idx === selectedTaskIndex}
            />
          );
        })}
        {filteredTaskIds.length === 0 && (
          <Box paddingX={1}>
            <Text dimColor italic>
              {searchQuery ? "No matches" : "Empty"}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
