export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  tags?: string[];
  subtasks?: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  name: string;
  taskIds: string[];
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  tasks: Record<string, Task>;
}

export interface Wall {
  id: string;
  name: string;
  boards: Board[];
}

export interface AppData {
  version: 2;
  walls: Wall[];
  activeWallId: string;
  activeBoardId: string;
}

export type AppMode = "board" | "command" | "detail" | "confirm" | "subtasks";
