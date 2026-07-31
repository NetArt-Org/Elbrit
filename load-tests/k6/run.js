#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const args = { scenario: null, envFile: null, extra: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--scenario") {
      args.scenario = argv[index + 1];
      index += 1;
      continue;
    }
    if (value === "--env-file") {
      args.envFile = argv[index + 1];
      index += 1;
      continue;
    }
    args.extra.push(value);
  }

  return args;
}

function parseEnvFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const entries = {};

  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  });

  return entries;
}

function commandExists(command) {
  const result = spawnSync("sh", ["-lc", `command -v ${command}`], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function dockerDaemonAvailable() {
  const result = spawnSync("docker", ["info"], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function resolveScenarioPath(name) {
  const scenarioMap = {
    app: "load-tests/k6/scenarios/app-shell-smoke.js",
    calendar: "load-tests/k6/scenarios/calendar-graphql-load.js",
    write: "load-tests/k6/scenarios/calendar-event-write-load.js",
  };

  const scenarioPath = scenarioMap[name];
  if (!scenarioPath) {
    throw new Error(`Unknown scenario "${name}". Use one of: ${Object.keys(scenarioMap).join(", ")}`);
  }

  return scenarioPath;
}

function buildDockerArgs(cwd, scenarioPath, envVars, extraArgs) {
  const args = [
    "run",
    "--rm",
    "-i",
    "-v",
    `${cwd}:/work`,
    "-w",
    "/work",
  ];

  Object.entries(envVars).forEach(([key, value]) => {
    args.push("-e", `${key}=${value}`);
  });

  args.push("grafana/k6:latest", "run", scenarioPath, ...extraArgs);
  return args;
}

function buildK6Args(scenarioPath, extraArgs) {
  return ["run", scenarioPath, ...extraArgs];
}

function main() {
  const cwd = process.cwd();
  const { scenario, envFile, extra } = parseArgs(process.argv.slice(2));

  if (!scenario) {
    throw new Error("Missing --scenario");
  }

  if (!envFile) {
    throw new Error("Missing --env-file");
  }

  const scenarioPath = resolveScenarioPath(scenario);
  const envVars = {
    ...process.env,
    ...parseEnvFile(envFile),
  };

  const k6Installed = commandExists("k6");
  const dockerInstalled = commandExists("docker");

  let result;

  if (k6Installed) {
    result = spawnSync("k6", buildK6Args(scenarioPath, extra), {
      stdio: "inherit",
      env: envVars,
      cwd,
    });
  } else if (dockerInstalled) {
    if (!dockerDaemonAvailable()) {
      throw new Error(
        "Docker is installed but the daemon is not running. Start Docker Desktop, wait until `docker info` succeeds, then rerun."
      );
    }

    result = spawnSync("docker", buildDockerArgs(cwd, scenarioPath, envVars, extra), {
      stdio: "inherit",
      env: process.env,
      cwd,
    });
  } else {
    throw new Error("Neither k6 nor docker is available. Install k6 or Docker.");
  }

  process.exit(result.status ?? 1);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
