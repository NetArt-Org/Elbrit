import http from "k6/http";
import { check } from "k6";
import { requiredEnv } from "./config.js";

export function safeJson(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export function graphqlRequest(query, variables = {}, tags = {}) {
  const url = requiredEnv("ERP_GRAPHQL_URL");
  const token = requiredEnv("ERP_AUTH_TOKEN");

  const response = http.post(
    url,
    JSON.stringify({ query, variables }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
      tags,
    }
  );

  const json = safeJson(response);
  const ok = check(response, {
    "graphql status is 200": (res) => res.status === 200,
    "graphql body is json": () => Boolean(json),
    "graphql has no errors": () =>
      Boolean(json) && (!json.errors || json.errors.length === 0),
  });

  if (!ok) {
    console.error(`GraphQL request failed: ${response.body}`);
  }

  return response;
}
