import React from "react";
import { Box } from "ink";
import type { Board as BoardType } from "../types.js";
import { Column } from "./Column.js";

interface BoardProps {
  board: BoardType;
  columnIndex: number;
  taskIndex: number;
  searchQuery: string;
}

export function Board({ board, columnIndex, taskIndex, searchQuery }: BoardProps) {
  return (
    <Box flexDirection="row" flexGrow={1}>
      {board.columns.map((col, idx) => (
        <Column
          key={col.id}
          column={col}
          tasks={board.tasks}
          focused={idx === columnIndex}
          selectedTaskIndex={idx === columnIndex ? taskIndex : -1}
          searchQuery={searchQuery}
        />
      ))}
    </Box>
  );
}
