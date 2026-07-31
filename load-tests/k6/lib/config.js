export function requiredEnv(name) {
  const value = __ENV[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function numberEnv(name, fallback) {
  const value = __ENV[name];
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function stageDurationEnv(name, fallback) {
  return __ENV[name] || fallback;
}

export function parseStagesEnv(name) {
  const raw = __ENV[name];
  if (!raw) return null;

  const stages = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [targetRaw, durationRaw] = part.split(":").map((value) => value?.trim());
      const target = Number(targetRaw);

      if (!Number.isFinite(target) || !durationRaw) {
        throw new Error(
          `Invalid ${name} value "${part}". Use format "10:1m,25:2m,50:3m".`
        );
      }

      return {
        target,
        duration: durationRaw,
      };
    });

  return stages.length > 0 ? stages : null;
}

export function buildArrivalRateScenario(defaults = {}) {
  const stages = parseStagesEnv("STAGES");

  if (stages) {
    return {
      executor: "ramping-arrival-rate",
      startRate: numberEnv("START_RATE", 1),
      timeUnit: "1s",
      preAllocatedVUs: numberEnv(
        "PRE_ALLOCATED_VUS",
        defaults.preAllocatedVUs ?? 20
      ),
      maxVUs: numberEnv("MAX_VUS", defaults.maxVUs ?? 100),
      stages,
    };
  }

  return {
    executor: "constant-arrival-rate",
    rate: numberEnv("RATE", defaults.rate ?? 10),
    timeUnit: "1s",
    duration: stageDurationEnv("DURATION", defaults.duration ?? "1m"),
    preAllocatedVUs: numberEnv(
      "PRE_ALLOCATED_VUS",
      defaults.preAllocatedVUs ?? 20
    ),
    maxVUs: numberEnv("MAX_VUS", defaults.maxVUs ?? 100),
  };
}

export const BASE_OPTIONS = {
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<2500", "p(99)<5000"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};
