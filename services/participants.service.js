import { graphqlRequest } from "@/lib/graphql-client";
import {
  EMPLOYEES_QUERY,DOCTOR_QUERY,HQ_TERRITORIES_QUERY
} from "@/services/events.query";

const MAX_ROWS = 1000; // safe upper bound

export async function fetchEmployees() {
  const data = await graphqlRequest(EMPLOYEES_QUERY, {
    first: MAX_ROWS,
  });

  return (
    data?.Employees?.edges.map(({ node }) => ({
      doctype: "Employee",
      value: node.name,          // ERP ID → saved
      label: node.employee_name, // UI text
    })) || []
  );
}


export async function fetchDoctors() {
  const data = await graphqlRequest(DOCTOR_QUERY, {
    first: MAX_ROWS,
  });

  return (
    data?.Leads?.edges.map(({ node }) => ({
      doctype: "Lead",
      value: node.name,
      label: node.lead_name,
    })) || []
  );
}

export async function fetchHQTerritories() {
  const data = await graphqlRequest(HQ_TERRITORIES_QUERY, {
    first: MAX_ROWS,
  });

  return (
    data?.Territorys?.edges.map(({ node }) => ({
      doctype: "Territory",
      value: node.name, // ERP value
      label: node.name, // UI label (same)
    })) || []
  );
}