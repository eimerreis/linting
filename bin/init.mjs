#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const packageName = "@eimerreis/linting";
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requireFromHere = createRequire(import.meta.url);

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

function getSelfDependencyRange() {
    try {
        const selfPackageJsonPath = resolve(packageRoot, "package.json");
        const selfPackageJson = readJson(selfPackageJsonPath);
        if (selfPackageJson.version) {
            return `^${selfPackageJson.version}`;
        }
    } catch {
        // ignore
    }

    return "latest";
}

function resolvePackageBin(dependencyName, binRelativePath) {
    const entryPointPath = requireFromHere.resolve(dependencyName);
    let cursor = dirname(entryPointPath);

    while (cursor !== dirname(cursor)) {
        const packageJsonPath = resolve(cursor, "package.json");
        if (existsSync(packageJsonPath)) {
            const packageJson = readJson(packageJsonPath);
            if (packageJson.name === dependencyName) {
                const binPath = resolve(cursor, binRelativePath);
                if (!existsSync(binPath)) {
                    throw new Error(`Cannot find ${dependencyName} binary at ${binPath}`);
                }
                return binPath;
            }
        }
        cursor = dirname(cursor);
    }

    throw new Error(`Unable to resolve package root for ${dependencyName}`);
}

function resolvePackageEntry(dependencyName) {
    return requireFromHere.resolve(dependencyName);
}

function hasInstalledPackage(dependencyName) {
    try {
        resolvePackageEntry(dependencyName);
        return true;
    } catch {
        return false;
    }
}

function resolveExistingConfigPath(targetDir, configCandidates) {
    for (const candidate of configCandidates) {
        const candidatePath = resolve(targetDir, candidate);
        if (existsSync(candidatePath)) {
            return candidatePath;
        }
    }

    return null;
}

function resolveLintConfigPath(targetDir) {
    const localConfigPath = resolveExistingConfigPath(targetDir, [
        ".oxlintrc.json",
        ".oxlintrc.jsonc",
        ".oxlintrc.js",
        ".oxlintrc.mjs",
        ".oxlintrc.cjs",
        ".oxlintrc.ts",
        ".oxlintrc.mts",
        ".oxlintrc.cts",
        "oxlint.config.js",
        "oxlint.config.mjs",
        "oxlint.config.cjs",
        "oxlint.config.ts",
        "oxlint.config.mts",
        "oxlint.config.cts",
    ]);

    if (localConfigPath) {
        return localConfigPath;
    }

    return resolve(packageRoot, "oxlint.config.json");
}

function resolveFormatConfigPath(targetDir) {
    const localConfigPath = resolveExistingConfigPath(targetDir, [
        ".oxfmtrc.json",
        ".oxfmtrc.jsonc",
        ".oxfmtrc.js",
        ".oxfmtrc.mjs",
        ".oxfmtrc.cjs",
        ".oxfmtrc.ts",
        ".oxfmtrc.mts",
        ".oxfmtrc.cts",
        "oxfmt.config.js",
        "oxfmt.config.mjs",
        "oxfmt.config.cjs",
        "oxfmt.config.ts",
        "oxfmt.config.mts",
        "oxfmt.config.cts",
    ]);

    if (localConfigPath) {
        return localConfigPath;
    }

    return resolve(packageRoot, "oxfmt.config.json");
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

    if (!packageJson.devDependencies || typeof packageJson.devDependencies !== "object") {
        packageJson.devDependencies = {};
    }

    const selfDependencyRange = getSelfDependencyRange();
    if (!packageJson.devDependencies[packageName] || force) {
        packageJson.devDependencies[packageName] = selfDependencyRange;
    }

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
    console.log("2) npm install");
    console.log("3) npm run lint && npm run format:check");
}

async function runInit(args) {
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
    if (!hasInstalledPackage("oxlint")) {
        console.error("oxlint is not installed. Run: npm install");
        process.exit(1);
    }

    const { targetDir, flags } = parsePathAndFlags(args, ["--fix"]);
    const oxlintBinPath = resolvePackageBin("oxlint", "bin/oxlint");
    const lintArgs = [oxlintBinPath];
    const lintConfigPath = resolveLintConfigPath(targetDir);

    lintArgs.push("-c", lintConfigPath);

    if (flags.has("--fix")) {
        lintArgs.push("--fix");
    }

    lintArgs.push(".");

    const lintExitCode = await runCommand(process.execPath, lintArgs, targetDir);
    if (lintExitCode !== 0) {
        process.exit(lintExitCode);
    }

    if (!hasReactProject(targetDir)) {
        console.log("skip react-doctor (no react/next dependency found)");
        return;
    }

    const reactDoctorEntryPath = resolvePackageEntry("react-doctor");
    const doctorExitCode = await runCommand(process.execPath, [reactDoctorEntryPath, "-y", "."], targetDir);
    if (doctorExitCode !== 0) {
        process.exit(doctorExitCode);
    }
}

async function runFormat(args) {
    if (!hasInstalledPackage("oxfmt")) {
        console.error("oxfmt is not installed. Run: npm install");
        process.exit(1);
    }

    const { targetDir, flags } = parsePathAndFlags(args, ["--check"]);
    const oxfmtBinPath = resolvePackageBin("oxfmt", "bin/oxfmt");
    const formatArgs = [oxfmtBinPath];
    const formatConfigPath = resolveFormatConfigPath(targetDir);

    formatArgs.push("-c", formatConfigPath);

    if (flags.has("--check")) {
        formatArgs.push("--check");
    }

    formatArgs.push(".");

    const formatExitCode = await runCommand(process.execPath, formatArgs, targetDir);
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
            await runInit(args);
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
