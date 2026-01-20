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
          fsl_territory {
          name
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
        designation{
        name
        }
      }
    }
  }
}
`;


export const DOCTOR_QUERY=`
query Doctors($first: Int) {
  Leads(first: $first) {
    edges {
      node {
        name
        lead_name
      }
    }
  }
}
`

export const HQ_TERRITORIES_QUERY = `
query GetHQTerritories($first: Int!){
  Territorys(first: $first)  {
    edges {
      node {
        name
      }
    }
  }
  }
`;
