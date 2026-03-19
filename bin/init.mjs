#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import process from "node:process";

const packageName = "@eimerreis/linting";
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const rawArgs = process.argv.slice(2);

if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  console.log("Usage: eimerreis-linting [init] [targetDir] [--force]");
  process.exit(0);
}

const args = rawArgs[0] === "init" ? rawArgs.slice(1) : rawArgs;
const force = args.includes("--force");
const targetArg = args.find((arg) => !arg.startsWith("-"));
const targetDir = resolve(process.cwd(), targetArg ?? ".");

const targetPackageJsonPath = resolve(targetDir, "package.json");
const oxlintPath = resolve(targetDir, ".oxlintrc.json");
const oxfmtPath = resolve(targetDir, ".oxfmtrc.json");

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

function upsertScript(packageJson, name, command) {
  if (!packageJson.scripts || typeof packageJson.scripts !== "object") {
    packageJson.scripts = {};
  }
  if (!packageJson.scripts[name] || force) {
    packageJson.scripts[name] = command;
  }
}

function createExtendsConfig(targetPath, exportPath) {
  if (existsSync(targetPath) && !force) {
    console.log(`skip ${targetPath} (already exists)`);
    return;
  }

  writeJson(targetPath, {
    extends: [`./node_modules/${packageName}/${exportPath}`],
  });
  console.log(`write ${targetPath}`);
}

function maybeUpdatePackageJson() {
  if (!existsSync(targetPackageJsonPath)) {
    console.log("skip package.json (not found)");
    return;
  }

  const packageJson = readJson(targetPackageJsonPath);

  upsertScript(packageJson, "lint", "oxlint .");
  upsertScript(packageJson, "lint:fix", "oxlint --fix .");
  upsertScript(packageJson, "format", "oxfmt .");
  upsertScript(packageJson, "format:check", "oxfmt --check .");

  writeJson(targetPackageJsonPath, packageJson);
  console.log(`update ${targetPackageJsonPath}`);
}

function printNextSteps() {
  const relativePath = targetDir === process.cwd() ? "." : targetDir;
  console.log("done");
  console.log("next steps:");
  console.log(`1) cd ${relativePath}`);
  console.log("2) npm add -D @eimerreis/linting oxlint oxfmt");
  console.log("3) npm run lint && npm run format:check");
}

function main() {
  if (!existsSync(packageRoot)) {
    console.error("init failed: package root not found");
    process.exit(1);
  }

  createExtendsConfig(oxlintPath, "oxlint.config.json");
  createExtendsConfig(oxfmtPath, "oxfmt.config.json");
  maybeUpdatePackageJson();
  printNextSteps();
}

main();
