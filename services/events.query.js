export const EVENTS_BY_RANGE_QUERY = `
query EventsByRange(
  $first: Int!
  $after: String
  $filters: [DBFilterInput!]
) {
  Events(first: $first, after: $after, filter: $filters) {
    edges {
      node {
        name
        subject
        description
        starts_on
        ends_on
        color
        event_category
        owner {
          name
          full_name
          email
        }
          event_participants {
          reference_doctype {
            name
          }
          reference_docname__name
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;

export const EMPLOYEES_QUERY = `
query GetEmployees($first: Int!) {
  Employees(
    first: $first
  ) {
    edges {
      node {
        name
        employee_name
        company_email
        idx
      }
    }
  }
}
`;

export const SALES_PARTNERS_QUERY = `
query GetSalesPartners($first: Int!) {
  SalesPartners(first: $first) {
    edges {
      node {
        name
      }
    }
  }
}
`;
