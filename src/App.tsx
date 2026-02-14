import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";
import { Board } from "./components/Board.js";
import { CommandBar } from "./components/CommandBar.js";
import { TaskDetail } from "./components/TaskDetail.js";
import { SubtaskView } from "./components/SubtaskView.js";
import { TaskDrawer } from "./components/TaskDrawer.js";
import { HelpBar } from "./components/HelpBar.js";
import { useBoard } from "./hooks/useBoard.js";
import { useNavigation } from "./hooks/useNavigation.js";
import { executeCommand } from "./commands.js";
import { loadAppData } from "./storage.js";
import { gitPull, gitPush, gitInit, gitSetRemote, gitStatus as gitStatusCmd } from "./git.js";
import type { AppMode } from "./types.js";

export function App() {
  const { exit } = useApp();
  const boardActions = useBoard(loadAppData());
  const { board, activeWall, walls, searchQuery } = boardActions;
  const nav = useNavigation(board);

  const [mode, setMode] = useState<AppMode>("board");
  const [showHelp, setShowHelp] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState("");
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [viewTaskId, setViewTaskId] = useState<string | null>(null);
  const [gitError, setGitError] = useState("");

  // Responsive width detection
  const { stdout } = useStdout();
  const isWide = (stdout.columns ?? 120) >= 100;

  // Quick-add mode
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState("");

  // Pull from remote on startup
  useEffect(() => {
    const result = gitPull();
    if (!result.success) {
      setGitError(result.message);
    }
  }, []);

  // Re-clamp navigation when board changes
  useEffect(() => {
    nav.ensureValid();
  }, [board.columns]);

  const openEditTask = useCallback((taskId: string) => {
    setDetailTaskId(taskId);
    setMode("detail");
  }, []);

  const showHelpOverlay = useCallback(() => {
    setShowHelp(true);
  }, []);

  const toggleView = useCallback((taskId: string | null) => {
    if (!taskId) return;
    setViewTaskId((prev) => (prev === taskId ? null : taskId));
  }, []);

  useInput((input, key) => {
    // Command bar mode handles its own input via TextInput
    if (mode === "command") {
      if (key.escape) {
        setMode("board");
        setCommandFeedback("");
      }
      return;
    }

    // Detail and subtask modes handle their own input
    if (mode === "detail") return;
    if (mode === "subtasks") return;

    // Confirm mode
    if (mode === "confirm") {
      if (input === "y" && confirmAction) {
        confirmAction();
        setMode("board");
        setConfirmAction(null);
        setConfirmMessage("");
      } else if (input === "n" || key.escape) {
        setMode("board");
        setConfirmAction(null);
        setConfirmMessage("");
      }
      return;
    }

    // Quick-add mode is handled by TextInput
    if (quickAdd) {
      if (key.escape) {
        setQuickAdd(false);
        setQuickAddValue("");
      }
      return;
    }

    // Board mode — Alt+key: move/reorder task
    if (key.meta && nav.currentTaskId && nav.currentColumn) {
      const taskId = nav.currentTaskId;
      const fromCol = nav.currentColumn;

      if (input === "h" || key.leftArrow) {
        const idx = board.columns.findIndex((c) => c.id === fromCol.id);
        if (idx > 0) {
          const toCol = board.columns[idx - 1]!;
          boardActions.moveTask(taskId, fromCol.id, toCol.id);
          nav.setColumnIndex(idx - 1);
          nav.setTaskIndex(toCol.taskIds.length); // appended at end
        }
      } else if (input === "l" || key.rightArrow) {
        const idx = board.columns.findIndex((c) => c.id === fromCol.id);
        if (idx < board.columns.length - 1) {
          const toCol = board.columns[idx + 1]!;
          boardActions.moveTask(taskId, fromCol.id, toCol.id);
          nav.setColumnIndex(idx + 1);
          nav.setTaskIndex(toCol.taskIds.length); // appended at end
        }
      } else if (input === "k" || key.upArrow) {
        boardActions.reorderTask(fromCol.id, taskId, "up");
        nav.moveUp();
      } else if (input === "j" || key.downArrow) {
        boardActions.reorderTask(fromCol.id, taskId, "down");
        nav.moveDown();
      }
      return;
    }

    // Board mode - normal navigation
    if (input === "q") {
      const result = gitPush();
      if (!result.success) {
        setGitError(result.message);
        setTimeout(() => exit(), 1500);
        return;
      }
      exit();
      return;
    }

    if (input === "?") {
      setShowHelp((h) => !h);
      return;
    }

    if (input === "/") {
      setMode("command");
      setCommandFeedback("");
      return;
    }

    if (input === "h" || key.leftArrow) {
      nav.moveLeft();
    } else if (input === "l" || key.rightArrow) {
      nav.moveRight();
    } else if (input === "k" || key.upArrow) {
      nav.moveUp();
    } else if (input === "j" || key.downArrow) {
      nav.moveDown();
    } else if (key.return) {
      if (nav.currentTaskId) {
        setDetailTaskId(nav.currentTaskId);
        setMode("detail");
      }
    } else if (input === "n") {
      setQuickAdd(true);
      setQuickAddValue("");
    } else if (input === "d") {
      if (nav.currentTaskId && nav.currentColumn) {
        const task = board.tasks[nav.currentTaskId];
        if (task) {
          const taskId = nav.currentTaskId;
          setConfirmMessage(`Delete "${task.title}"?`);
          setConfirmAction(() => () => {
            boardActions.deleteTask(taskId);
            if (viewTaskId === taskId) setViewTaskId(null);
          });
          setMode("confirm");
        }
      }
    } else if (input === "v") {
      toggleView(nav.currentTaskId);
    }
  });

  function handleCommandSubmit(input: string) {
    const result = executeCommand(input, {
      board,
      activeWall,
      walls,
      currentColumnId: nav.currentColumn?.id ?? board.columns[0]?.id ?? "",
      addTask: boardActions.addTask,
      deleteTask: boardActions.deleteTask,
      moveTask: boardActions.moveTask,
      moveTaskTo: boardActions.moveTaskTo,
      addColumn: boardActions.addColumn,
      removeColumn: boardActions.removeColumn,
      search: boardActions.search,
      clearSearch: boardActions.clearSearch,
      openEditTask,
      showHelp: showHelpOverlay,
      addWall: boardActions.addWall,
      deleteWall: boardActions.deleteWall,
      switchWall: boardActions.switchWall,
      addBoard: boardActions.addBoard,
      deleteBoard: boardActions.deleteBoard,
      switchBoard: boardActions.switchBoard,
      gitInit,
      gitSetRemote,
      gitPush,
      gitPull,
      gitStatus: gitStatusCmd,
    });

    if (result.message) {
      setCommandFeedback(result.message);
    }

    if (result.success) {
      // Small delay before closing command bar on success
      setTimeout(() => {
        setMode((current) => (current === "command" ? "board" : current));
        setCommandFeedback("");
      }, 800);
    }
  }

  function handleQuickAddSubmit(val: string) {
    const firstCol = board.columns[0];
    if (val.trim() && firstCol) {
      boardActions.addTask(firstCol.id, val.trim());
    }
    setQuickAdd(false);
    setQuickAddValue("");
  }

  const detailTask = detailTaskId ? board.tasks[detailTaskId] : null;
  const viewTask = viewTaskId ? board.tasks[viewTaskId] ?? null : null;

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Header */}
      <Box paddingX={1} justifyContent="space-between">
        <Text bold color="magenta">
          inkan
        </Text>
        <Text dimColor>{activeWall.name} / {board.name}</Text>
        {searchQuery && (
          <Text color="yellow">Search: "{searchQuery}"</Text>
        )}
      </Box>

      {/* Main content */}
      <Box flexDirection="row" flexGrow={1}>
        {mode === "subtasks" && detailTask ? (
          <SubtaskView
            task={detailTask}
            onSave={(updates) => {
              boardActions.editTask(detailTaskId!, updates);
            }}
            onClose={() => {
              setMode("detail");
            }}
          />
        ) : mode === "detail" && detailTask ? (
          <TaskDetail
            task={detailTask}
            onSave={(updates) => {
              boardActions.editTask(detailTaskId!, updates);
            }}
            onClose={() => {
              setMode("board");
              setDetailTaskId(null);
            }}
            onOpenSubtasks={() => {
              setMode("subtasks");
            }}
          />
        ) : (
          <>
            {(!viewTask || isWide) && (
              <Board
                board={board}
                columnIndex={nav.columnIndex}
                taskIndex={nav.taskIndex}
                searchQuery={searchQuery}
              />
            )}
            {viewTask && <TaskDrawer task={viewTask} fullWidth={!isWide} />}
          </>
        )}
      </Box>

      {/* Confirm dialog */}
      {mode === "confirm" && (
        <Box paddingX={1} borderStyle="single" borderColor="red">
          <Text color="red" bold>
            {confirmMessage}
          </Text>
          <Text> (y/n)</Text>
        </Box>
      )}

      {/* Quick add */}
      {quickAdd && (
        <Box paddingX={1} borderStyle="single" borderColor="green">
          <Text color="green">New task: </Text>
          <QuickAddInput
            value={quickAddValue}
            onChange={setQuickAddValue}
            onSubmit={handleQuickAddSubmit}
          />
        </Box>
      )}

      {/* Command bar */}
      {mode === "command" && (
        <CommandBar
          onSubmit={handleCommandSubmit}
          onCancel={() => {
            setMode("board");
            setCommandFeedback("");
          }}
          feedback={commandFeedback}
          taskTitles={Object.values(board.tasks).map((t) => t.title)}
          columnNames={board.columns.map((c) => c.name)}
          wallNames={walls.map((w) => w.name)}
          boardNames={activeWall.boards.map((b) => b.name)}
        />
      )}

      {/* Git error */}
      {gitError && (
        <Box paddingX={1}>
          <Text color="red">Git: {gitError}</Text>
        </Box>
      )}

      {/* Help / status bar */}
      <HelpBar mode={mode} showFullHelp={showHelp} />
    </Box>
  );
}

// Separate component to isolate TextInput
function QuickAddInput({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
}) {
  return <TextInput value={value} onChange={onChange} onSubmit={onSubmit} />;
}
