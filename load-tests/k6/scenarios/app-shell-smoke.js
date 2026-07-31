import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_OPTIONS, buildArrivalRateScenario, numberEnv, requiredEnv } from "../lib/config.js";

export const options = {
  ...BASE_OPTIONS,
  scenarios: {
    app_shell_smoke: buildArrivalRateScenario({
      rate: 10,
      duration: "2m",
      preAllocatedVUs: 10,
      maxVUs: 50,
    }),
  },
};

export default function () {
  const baseUrl = requiredEnv("APP_BASE_URL");
  const response = http.get(baseUrl, {
    tags: { name: "app_shell" },
  });

  check(response, {
    "app shell status is 200": (res) => res.status === 200,
    "app shell returned html": (res) => String(res.headers["Content-Type"] || "").includes("text/html"),
  });

  sleep(numberEnv("SLEEP_SECONDS", 0.2));
}
