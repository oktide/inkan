function findTaskByTitle(board, title) {
    const lower = title.toLowerCase();
    for (const col of board.columns) {
        for (const taskId of col.taskIds) {
            const task = board.tasks[taskId];
            if (task && task.title.toLowerCase().includes(lower)) {
                return { taskId, columnId: col.id };
            }
        }
    }
    return null;
}
function findColumnByName(board, name) {
    const lower = name.toLowerCase();
    const col = board.columns.find((c) => c.name.toLowerCase().includes(lower));
    return col?.id ?? null;
}
export function executeCommand(input, ctx) {
    const trimmed = input.trim();
    if (!trimmed)
        return { success: false, message: "Empty command" };
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ");
    switch (cmd) {
        case "new": {
            if (!args)
                return { success: false, message: "Usage: /new <title>" };
            ctx.addTask(ctx.currentColumnId, args);
            return { success: true, message: `Created "${args}"` };
        }
        case "delete": {
            if (!args)
                return { success: false, message: "Usage: /delete <title>" };
            const found = findTaskByTitle(ctx.board, args);
            if (!found)
                return { success: false, message: `Task "${args}" not found` };
            ctx.deleteTask(found.taskId);
            return { success: true, message: `Deleted "${ctx.board.tasks[found.taskId]?.title}"` };
        }
        case "move": {
            // /move <title> <column>
            // Try to split: last word(s) matching a column name
            if (!args)
                return { success: false, message: "Usage: /move <title> <column>" };
            // Try matching column name from the end
            for (let i = parts.length - 1; i >= 2; i--) {
                const colName = parts.slice(i).join(" ");
                const colId = findColumnByName(ctx.board, colName);
                if (colId) {
                    const taskTitle = parts.slice(1, i).join(" ");
                    const found = findTaskByTitle(ctx.board, taskTitle);
                    if (!found)
                        return { success: false, message: `Task "${taskTitle}" not found` };
                    ctx.moveTask(found.taskId, found.columnId, colId);
                    return { success: true, message: `Moved to ${ctx.board.columns.find((c) => c.id === colId)?.name}` };
                }
            }
            return { success: false, message: "Could not find target column" };
        }
        case "edit": {
            if (!args)
                return { success: false, message: "Usage: /edit <title>" };
            const found = findTaskByTitle(ctx.board, args);
            if (!found)
                return { success: false, message: `Task "${args}" not found` };
            ctx.openEditTask(found.taskId);
            return { success: true, message: "" };
        }
        case "col": {
            const subParts = args.split(/\s+/);
            const sub = subParts[0]?.toLowerCase();
            const colName = subParts.slice(1).join(" ");
            if (sub === "add") {
                if (!colName)
                    return { success: false, message: "Usage: /col add <name>" };
                ctx.addColumn(colName);
                return { success: true, message: `Added column "${colName}"` };
            }
            if (sub === "rm") {
                if (!colName)
                    return { success: false, message: "Usage: /col rm <name>" };
                const colId = findColumnByName(ctx.board, colName);
                if (!colId)
                    return { success: false, message: `Column "${colName}" not found` };
                const col = ctx.board.columns.find((c) => c.id === colId);
                if (col && col.taskIds.length > 0) {
                    return { success: false, message: "Cannot remove non-empty column" };
                }
                ctx.removeColumn(colId);
                return { success: true, message: `Removed column "${col?.name}"` };
            }
            return { success: false, message: "Usage: /col add|rm <name>" };
        }
        case "search": {
            if (!args) {
                ctx.clearSearch();
                return { success: true, message: "Search cleared" };
            }
            ctx.search(args);
            return { success: true, message: `Searching: "${args}"` };
        }
        case "help": {
            ctx.showHelp();
            return { success: true, message: "" };
        }
        default:
            return { success: false, message: `Unknown command: ${cmd}` };
    }
}
