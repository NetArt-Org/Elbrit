const GRAPHQL_ENDPOINT = "https://uat.elbrit.org/api/method/graphql";

export async function graphqlRequest(query, variables = {}) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${process.env.NEXT_PUBLIC_FRAPPE_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error("Invalid response from ERP GraphQL");
  }

  if (!res.ok) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}
