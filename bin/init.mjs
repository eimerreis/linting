#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import process from "node:process";

const packageName = "@eimerreis/linting";
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function ensureDirectory(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function writeJson(filePath, data) {
  ensureDirectory(filePath);
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function printUsage() {
  console.log("Usage:");
  console.log("  eimerreis-linting init [targetDir] [--force]");
  console.log("  eimerreis-linting lint [targetDir] [--fix]");
  console.log("  eimerreis-linting format [targetDir] [--check]");
}

function parseCommand(rawArgs) {
  const firstArg = rawArgs[0];
  if (!firstArg || firstArg === "init" || firstArg.startsWith("-")) {
    return {
      command: "init",
      args: firstArg === "init" ? rawArgs.slice(1) : rawArgs,
    };
  }

  return {
    command: firstArg,
    args: rawArgs.slice(1),
  };
}

function parsePathAndFlags(args, allowedFlags) {
  let targetDirArg;
  const flags = new Set();

  for (const arg of args) {
    if (arg.startsWith("-")) {
      if (!allowedFlags.includes(arg)) {
        throw new Error(`Unknown flag: ${arg}`);
      }
      flags.add(arg);
      continue;
    }

    if (targetDirArg) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    targetDirArg = arg;
  }

  return {
    targetDir: resolve(process.cwd(), targetDirArg ?? "."),
    flags,
  };
}

function runCommand(command, commandArgs, cwd) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, commandArgs, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", (error) => {
      console.error(`failed to run ${command}: ${error.message}`);
      resolvePromise(1);
    });

    child.on("close", (code) => {
      resolvePromise(code ?? 1);
    });
  });
}

function hasReactProject(cwd) {
  const packageJsonPath = resolve(cwd, "package.json");

  if (!existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = readJson(packageJsonPath);
    const dependencyFields = ["dependencies", "devDependencies", "peerDependencies"];

    return dependencyFields.some((field) => {
      const deps = packageJson[field];
      return Boolean(deps?.react || deps?.["react-dom"] || deps?.next);
    });
  } catch {
    return false;
  }
}

function upsertScript(packageJson, name, command, force) {
  if (!packageJson.scripts || typeof packageJson.scripts !== "object") {
    packageJson.scripts = {};
  }
  if (!packageJson.scripts[name] || force) {
    packageJson.scripts[name] = command;
  }
}

function createExtendsConfig(targetPath, exportPath, force) {
  if (existsSync(targetPath) && !force) {
    console.log(`skip ${targetPath} (already exists)`);
    return;
  }

  writeJson(targetPath, {
    extends: [`./node_modules/${packageName}/${exportPath}`],
  });
  console.log(`write ${targetPath}`);
}

function maybeUpdatePackageJson(targetPackageJsonPath, force) {
  if (!existsSync(targetPackageJsonPath)) {
    console.log("skip package.json (not found)");
    return;
  }

  const packageJson = readJson(targetPackageJsonPath);

  upsertScript(packageJson, "lint", "eimerreis-linting lint", force);
  upsertScript(packageJson, "lint:fix", "eimerreis-linting lint --fix", force);
  upsertScript(packageJson, "format", "eimerreis-linting format", force);
  upsertScript(packageJson, "format:check", "eimerreis-linting format --check", force);

  writeJson(targetPackageJsonPath, packageJson);
  console.log(`update ${targetPackageJsonPath}`);
}

function printNextSteps(targetDir) {
  const relativePath = targetDir === process.cwd() ? "." : targetDir;
  console.log("done");
  console.log("next steps:");
  console.log(`1) cd ${relativePath}`);
  console.log("2) npm add -D @eimerreis/linting oxlint oxfmt");
  console.log("3) npm run lint && npm run format:check");
}

function runInit(args) {
  const { targetDir, flags } = parsePathAndFlags(args, ["--force"]);
  const force = flags.has("--force");
  const targetPackageJsonPath = resolve(targetDir, "package.json");
  const oxlintPath = resolve(targetDir, ".oxlintrc.json");
  const oxfmtPath = resolve(targetDir, ".oxfmtrc.json");

  if (!existsSync(packageRoot)) {
    console.error("init failed: package root not found");
    process.exit(1);
  }

  createExtendsConfig(oxlintPath, "oxlint.config.json", force);
  createExtendsConfig(oxfmtPath, "oxfmt.config.json", force);
  maybeUpdatePackageJson(targetPackageJsonPath, force);
  printNextSteps(targetDir);
}

async function runLint(args) {
  const { targetDir, flags } = parsePathAndFlags(args, ["--fix"]);
  const lintArgs = ["--no-install", "oxlint"];

  if (flags.has("--fix")) {
    lintArgs.push("--fix");
  }

  lintArgs.push(".");

  const lintExitCode = await runCommand("npx", lintArgs, targetDir);
  if (lintExitCode !== 0) {
    process.exit(lintExitCode);
  }

  if (!hasReactProject(targetDir)) {
    console.log("skip react-doctor (no react/next dependency found)");
    return;
  }

  const doctorExitCode = await runCommand("npx", ["react-doctor", "-y", "."], targetDir);
  if (doctorExitCode !== 0) {
    process.exit(doctorExitCode);
  }
}

async function runFormat(args) {
  const { targetDir, flags } = parsePathAndFlags(args, ["--check"]);
  const formatArgs = ["--no-install", "oxfmt"];

  if (flags.has("--check")) {
    formatArgs.push("--check");
  }

  formatArgs.push(".");

  const formatExitCode = await runCommand("npx", formatArgs, targetDir);
  if (formatExitCode !== 0) {
    process.exit(formatExitCode);
  }
}

async function main() {
  try {
    const rawArgs = process.argv.slice(2);
    if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
      printUsage();
      process.exit(0);
    }

    const { command, args } = parseCommand(rawArgs);

    if (command === "init") {
      runInit(args);
      return;
    }

    if (command === "lint") {
      await runLint(args);
      return;
    }

    if (command === "format") {
      await runFormat(args);
      return;
    }

    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
