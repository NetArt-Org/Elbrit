import { graphqlRequest } from "@/lib/graphql-client";
import {
  EMPLOYEES_QUERY,
  SALES_PARTNERS_QUERY,
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

export async function fetchSalesPartner() {
  const data = await graphqlRequest(SALES_PARTNERS_QUERY, {
    first: MAX_ROWS,
  });

  return (
    data?.SalesPartners?.edges.map(({ node }) => ({
      doctype: "Sales Partner",
      value: node.name,
      label: node.name,
    })) || []
  );
}
