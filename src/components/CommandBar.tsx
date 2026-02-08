import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

const COMMANDS = [
  { name: "new", args: "task|board|wall|column <name>", desc: "Create task, board, wall, or column" },
  { name: "move", args: "<title> <column>", desc: "Move task to column" },
  { name: "delete", args: "[board|wall|column] <name>", desc: "Delete task, board, wall, or column" },
  { name: "edit", args: "<title>", desc: "Open task for editing" },
  { name: "open", args: "<title>", desc: "Open task detail + body" },
  { name: "wall", args: "<name>", desc: "Switch to a wall" },
  { name: "board", args: "<name>", desc: "Switch to a board" },
  { name: "search", args: "<query>", desc: "Filter visible tasks" },
  { name: "help", args: "", desc: "Show all keybindings" },
];

interface CommandBarProps {
  onSubmit: (command: string) => void;
  onCancel: () => void;
  feedback: string;
  taskTitles: string[];
  columnNames: string[];
  wallNames: string[];
  boardNames: string[];
}

type ArgPhase = "command" | "task" | "column" | "wall" | "board" | "newSub" | "none";

const NEW_SUB_CANDIDATES = ["task", "board", "wall", "column"];

function getArgPhase(value: string, confirmedTaskTitle: string | null): ArgPhase {
  if (!value.includes(" ")) return "command";

  const lower = value.toLowerCase();

  // /new <...> — determine subcommand phase
  if (lower.startsWith("new ")) {
    const afterNew = value.slice(4).trimStart();
    // If no space after subcommand word yet, suggest subcommands
    if (!afterNew.includes(" ")) return "newSub";
    // After subcommand is chosen, no autocomplete for the name itself
    return "none";
  }

  // /wall <...>
  if (lower.startsWith("wall ")) return "wall";

  // /board <...>
  if (lower.startsWith("board ")) return "board";

  // /delete wall|board|column <...>
  if (lower.startsWith("delete ")) {
    const afterDelete = value.slice(7).trimStart();
    const afterDeleteLower = afterDelete.toLowerCase();
    if (afterDeleteLower.startsWith("wall ")) return "wall";
    if (afterDeleteLower.startsWith("board ")) return "board";
    if (afterDeleteLower.startsWith("column ")) return "column";
    return "task";
  }

  if (lower.startsWith("edit ") || lower.startsWith("open ")) return "task";
  if (lower.startsWith("move ")) {
    return confirmedTaskTitle ? "column" : "task";
  }
  return "none";
}

function getPartialArg(value: string, phase: ArgPhase, confirmedTaskTitle: string | null): string {
  if (phase === "command" || phase === "none") return "";

  if (phase === "newSub") {
    // Everything after "new "
    const idx = value.indexOf(" ");
    return idx >= 0 ? value.slice(idx + 1) : "";
  }

  if (phase === "wall") {
    const lower = value.toLowerCase();
    if (lower.startsWith("delete ")) {
      // "delete wall " prefix
      const afterDelete = value.slice(7).trimStart();
      const spaceIdx = afterDelete.indexOf(" ");
      return spaceIdx >= 0 ? afterDelete.slice(spaceIdx + 1) : "";
    }
    // "wall " prefix
    return value.slice(5);
  }

  if (phase === "board") {
    const lower = value.toLowerCase();
    if (lower.startsWith("delete ")) {
      // "delete board " prefix
      const afterDelete = value.slice(7).trimStart();
      const spaceIdx = afterDelete.indexOf(" ");
      return spaceIdx >= 0 ? afterDelete.slice(spaceIdx + 1) : "";
    }
    // "board " prefix
    return value.slice(6);
  }

  if (phase === "column") {
    const lower = value.toLowerCase();
    if (lower.startsWith("delete ")) {
      // "delete column " prefix
      const afterDelete = value.slice(7).trimStart();
      const spaceIdx = afterDelete.indexOf(" ");
      return spaceIdx >= 0 ? afterDelete.slice(spaceIdx + 1) : "";
    }
    if (confirmedTaskTitle && lower.startsWith("move ")) {
      // For /move after task confirmed: arg text is after "move <confirmedTitle> "
      const prefix = value.slice(0, 5) + confirmedTaskTitle + " ";
      return value.slice(prefix.length);
    }
  }

  // For edit/delete/move task phase: everything after first space
  const spaceIdx = value.indexOf(" ");
  return spaceIdx >= 0 ? value.slice(spaceIdx + 1) : "";
}

function computeGhostText(partial: string, candidates: string[]): string {
  if (!partial) return "";
  const lowerPartial = partial.toLowerCase();
  for (const name of candidates) {
    if (name.toLowerCase().startsWith(lowerPartial)) {
      return name.slice(partial.length);
    }
  }
  return "";
}

export function CommandBar({ onSubmit, onCancel, feedback, taskTitles, columnNames, wallNames, boardNames }: CommandBarProps) {
  const [value, setValue] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmedTaskTitle, setConfirmedTaskTitle] = useState<string | null>(null);

  const matches = useMemo(() => {
    const typed = value.toLowerCase().split(/\s+/)[0] ?? "";
    if (!typed) return COMMANDS;
    return COMMANDS.filter((cmd) => cmd.name.startsWith(typed));
  }, [value]);

  const showSuggestions = !value.includes(" ") && matches.length > 0;

  const { phase, partialArg, ghostText } = useMemo(() => {
    const phase = getArgPhase(value, confirmedTaskTitle);
    const partialArg = getPartialArg(value, phase, confirmedTaskTitle);

    let candidates: string[] = [];
    if (phase === "task") candidates = taskTitles;
    else if (phase === "column") candidates = columnNames;
    else if (phase === "wall") candidates = wallNames;
    else if (phase === "board") candidates = boardNames;
    else if (phase === "newSub") candidates = NEW_SUB_CANDIDATES;

    const ghostText = computeGhostText(partialArg, candidates);
    return { phase, partialArg, ghostText };
  }, [value, confirmedTaskTitle, taskTitles, columnNames, wallNames, boardNames]);

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

    // Arg phase: Tab accepts ghost text
    if (!showSuggestions && key.tab && ghostText) {
      if (phase === "task" && value.toLowerCase().startsWith("move ")) {
        // Confirm the task title and append space for column arg
        const fullTitle = partialArg + ghostText;
        setConfirmedTaskTitle(fullTitle);
        const cmdPrefix = value.slice(0, value.indexOf(" ") + 1);
        setValue(cmdPrefix + fullTitle + " ");
      } else if (phase === "newSub") {
        // After completing subcommand, add a space for the name
        setValue(value.slice(0, value.indexOf(" ") + 1) + partialArg + ghostText + " ");
      } else {
        setValue(value + ghostText);
      }
      return;
    }
  });

  function handleChange(val: string) {
    // Clear confirmedTaskTitle if user backspaces past it
    if (confirmedTaskTitle) {
      const expectedPrefix = "move " + confirmedTaskTitle;
      if (!val.toLowerCase().startsWith(expectedPrefix.toLowerCase())) {
        setConfirmedTaskTitle(null);
      }
    }
    setValue(val);
    setSelectedIndex(0);
  }

  function handleSubmit(val: string) {
    // If suggestions are showing and user hits enter, autocomplete first
    if (showSuggestions && matches.length > 0 && !val.includes(" ")) {
      const match = matches[selectedIndex];
      if (match && match.name !== val) {
        setValue(match.name + " ");
        setSelectedIndex(0);
        return;
      }
    }

    // For /move in task phase with ghost text: Enter confirms task (like Tab)
    if (phase === "task" && ghostText && val.toLowerCase().startsWith("move ")) {
      const fullTitle = partialArg + ghostText;
      setConfirmedTaskTitle(fullTitle);
      const cmdPrefix = val.slice(0, val.indexOf(" ") + 1);
      setValue(cmdPrefix + fullTitle + " ");
      return;
    }

    onSubmit(val);
    setValue("");
    setConfirmedTaskTitle(null);
  }

  const showGhost = !showSuggestions && (phase === "task" || phase === "column" || phase === "wall" || phase === "board" || phase === "newSub") && ghostText;

  return (
    <Box flexDirection="column">
      {/* Suggestions dropdown (above the input) */}
      {showSuggestions && (
        <Box
          flexDirection="column"
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
        >
          {matches.map((cmd, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <Box key={cmd.name} gap={1}>
                <Text
                  color={isSelected ? "cyan" : "yellow"}
                  bold={isSelected}
                >
                  {isSelected ? ">" : " "} /{cmd.name}
                </Text>
                {cmd.args && <Text dimColor>{cmd.args}</Text>}
                <Text color={isSelected ? "white" : "gray"}>
                  — {cmd.desc}
                </Text>
              </Box>
            );
          })}
          <Text dimColor italic>
            ↑↓ navigate  Tab autocomplete  Enter select
          </Text>
        </Box>
      )}

      {/* Input bar */}
      <Box borderStyle="single" borderColor="yellow" paddingX={1}>
        <Text color="yellow">/</Text>
        <TextInput
          value={value}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
        {showGhost && <Text dimColor>{ghostText}</Text>}
        {feedback && (
          <Box marginLeft={2}>
            <Text dimColor>{feedback}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
