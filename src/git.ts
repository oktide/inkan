import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CONFIG_DIR = path.join(os.homedir(), ".config", "inkan");

/** Env that disables git credential prompts so network ops fail fast instead of hanging. */
const NO_PROMPT_ENV = { ...process.env, GIT_TERMINAL_PROMPT: "0" };

/**
 * Check if the inkan config directory is a git repository.
 */
export function isGitRepo(): boolean {
  try {
    return fs.existsSync(path.join(CONFIG_DIR, ".git"));
  } catch {
    return false;
  }
}

/**
 * Check if an `origin` remote is configured.
 */
export function hasRemote(): boolean {
  if (!isGitRepo()) return false;
  try {
    const result = execSync("git remote get-url origin", {
      cwd: CONFIG_DIR,
      stdio: "pipe",
    });
    return result.toString().trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Initialize a git repo in the config directory with an initial commit.
 */
export function gitInit(): { success: boolean; message: string } {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    execSync("git init", { cwd: CONFIG_DIR, stdio: "pipe" });
    execSync("git add -A", { cwd: CONFIG_DIR, stdio: "pipe" });
    execSync('git commit -m "Initial inkan commit"', {
      cwd: CONFIG_DIR,
      stdio: "pipe",
    });
    return { success: true, message: "Git repository initialized." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Failed to initialize git repo: ${msg}` };
  }
}

/**
 * Add or update the `origin` remote URL.
 */
export function gitSetRemote(
  url: string,
): { success: boolean; message: string } {
  if (!isGitRepo()) {
    return { success: false, message: "Not a git repository." };
  }
  try {
    if (hasRemote()) {
      execSync(`git remote set-url origin ${url}`, {
        cwd: CONFIG_DIR,
        stdio: "pipe",
      });
    } else {
      execSync(`git remote add origin ${url}`, {
        cwd: CONFIG_DIR,
        stdio: "pipe",
      });
    }
    return { success: true, message: `Remote set to ${url}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Failed to set remote: ${msg}` };
  }
}

/**
 * Stage all changes and commit. Silently skips if not a git repo or nothing to commit.
 */
export function gitCommit(
  message: string,
): { success: boolean; message: string } {
  if (!isGitRepo()) {
    return { success: true, message: "Not a git repo, skipping commit." };
  }
  try {
    execSync("git add -A", { cwd: CONFIG_DIR, stdio: "pipe" });

    // Check if there are staged changes. git diff --cached --quiet exits
    // with code 1 when there ARE staged changes.
    try {
      execSync("git diff --cached --quiet", {
        cwd: CONFIG_DIR,
        stdio: "pipe",
      });
      // Exit code 0 means nothing staged — nothing to commit
      return { success: true, message: "Nothing to commit." };
    } catch {
      // Exit code 1 means there are staged changes — proceed with commit
    }

    execSync(`git commit -m ${JSON.stringify(message)}`, {
      cwd: CONFIG_DIR,
      stdio: "pipe",
    });
    return { success: true, message: "Changes committed." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Commit failed: ${msg}` };
  }
}

/**
 * Pull with rebase. Silently skips if not a git repo or no remote.
 */
export function gitPull(): { success: boolean; message: string } {
  if (!isGitRepo()) {
    return { success: true, message: "Not a git repo, skipping pull." };
  }
  if (!hasRemote()) {
    return { success: true, message: "No remote configured, skipping pull." };
  }
  try {
    execSync("git pull --rebase", { cwd: CONFIG_DIR, stdio: "pipe", env: NO_PROMPT_ENV });
    return { success: true, message: "Pulled latest changes." };
  } catch (err) {
    const stderr = (err as any)?.stderr?.toString?.() ?? "";
    if (stderr.includes("terminal prompts disabled") || stderr.includes("Authentication failed")) {
      return { success: false, message: "Git credentials not configured. Set up SSH keys or a credential helper for your remote." };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Pull failed: ${msg}` };
  }
}

/**
 * Push to remote. On first push, sets upstream to origin/<current branch>.
 * Silently skips if not a git repo or no remote.
 */
export function gitPush(): { success: boolean; message: string } {
  if (!isGitRepo()) {
    return { success: true, message: "Not a git repo, skipping push." };
  }
  if (!hasRemote()) {
    return { success: true, message: "No remote configured, skipping push." };
  }
  try {
    // Check if the current branch has an upstream set
    let hasUpstream = false;
    try {
      execSync("git rev-parse --abbrev-ref @{u}", {
        cwd: CONFIG_DIR,
        stdio: "pipe",
      });
      hasUpstream = true;
    } catch {
      // No upstream configured
    }

    if (hasUpstream) {
      execSync("git push", { cwd: CONFIG_DIR, stdio: "pipe", env: NO_PROMPT_ENV });
    } else {
      const branch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd: CONFIG_DIR,
        stdio: "pipe",
      })
        .toString()
        .trim();
      execSync(`git push -u origin ${branch}`, {
        cwd: CONFIG_DIR,
        stdio: "pipe",
        env: NO_PROMPT_ENV,
      });
    }
    return { success: true, message: "Pushed to remote." };
  } catch (err) {
    const stderr = (err as any)?.stderr?.toString?.() ?? "";
    if (stderr.includes("terminal prompts disabled") || stderr.includes("Authentication failed")) {
      return { success: false, message: "Git credentials not configured. Set up SSH keys or a credential helper for your remote." };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Push failed: ${msg}` };
  }
}

/**
 * Report the current git state of the config directory.
 */
export function gitStatus(): {
  initialized: boolean;
  remote: string | null;
  clean: boolean;
} {
  if (!isGitRepo()) {
    return { initialized: false, remote: null, clean: true };
  }

  let remote: string | null = null;
  try {
    remote = execSync("git remote get-url origin", {
      cwd: CONFIG_DIR,
      stdio: "pipe",
    })
      .toString()
      .trim();
  } catch {
    remote = null;
  }

  let clean = true;
  try {
    const status = execSync("git status --porcelain", {
      cwd: CONFIG_DIR,
      stdio: "pipe",
    })
      .toString()
      .trim();
    clean = status.length === 0;
  } catch {
    clean = true;
  }

  return { initialized: true, remote, clean };
}
