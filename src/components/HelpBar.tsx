import React from "react";
import { Box, Text } from "ink";
import type { AppMode } from "../types.js";

interface HelpBarProps {
  mode: AppMode;
  showFullHelp: boolean;
}

const FULL_HELP = [
  ["h/\u2190", "Move left"],
  ["l/\u2192", "Move right"],
  ["k/\u2191", "Move up"],
  ["j/\u2193", "Move down"],
  ["Enter", "Open task"],
  ["n", "New task"],
  ["d", "Delete task"],
  ["m+h/l", "Move task"],
  ["v", "View task body"],
  ["/", "Command bar"],
  ["?", "Toggle help"],
  ["q", "Quit"],
  ["", ""],
  ["/new [task|board|wall|column] <name>", "Create task, board, wall, or column"],
  ["/move <title> <col>", "Move task"],
  ["/delete [task|board|wall|column] <name>", "Delete task, board, wall, or column"],
  ["/edit <title>", "Edit task"],
  ["/open <title>", "Open task detail + body"],
  ["/wall <name>", "Switch wall"],
  ["/board <name>", "Switch board"],
  ["/search <query>", "Filter tasks"],
  ["/help", "Show help"],
];

export function HelpBar({ mode, showFullHelp }: HelpBarProps) {
  if (showFullHelp) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="green"
        paddingX={1}
      >
        <Text bold color="green">
          Keybindings & Commands
        </Text>
        {FULL_HELP.map(([key, desc], i) =>
          key ? (
            <Box key={i} gap={1}>
              <Text color="yellow" bold>
                {key!.padEnd(22)}
              </Text>
              <Text>{desc}</Text>
            </Box>
          ) : (
            <Text key={i}> </Text>
          )
        )}
        <Text dimColor>Press ? to close</Text>
      </Box>
    );
  }

  const hints: Record<AppMode, string> = {
    board: "hjkl:nav  n:new  d:del  m+h/l:move  Enter:detail  v:view  /:cmd  ?:help  q:quit",
    command: "Enter:run  Esc:cancel",
    detail: "j/k:nav  Enter/e:edit  b:body  Esc/q:close",
    confirm: "y:confirm  n/Esc:cancel",
  };

  return (
    <Box paddingX={1}>
      <Text dimColor>{hints[mode]}</Text>
    </Box>
  );
}
