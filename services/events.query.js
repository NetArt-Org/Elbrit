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
        all_day
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
export const TODO_LIST_QUERY = `
query ToDoes($first: Int!, $filters: [DBFilterInput!]) {
  ToDoes(first: $first, filter: $filters) {
    edges {
      node {
        name
        description
        date
        priority
        status
        allocated_to {
          name
        }
        reference_type__name
        reference_name__name
      }
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

export const LEAVE_QUERY=`
query LeaveApplications($first: Int) {
  LeaveApplications(first: $first) {
    edges {
      node {
        from_date
        to_date
        half_day
        half_day_date
        total_leave_days
        description
        posting_date
        status
        fsl_attach
        leave_approver_name
        leave_approver__name
        leave_balance
        employee__name
        employee_name
        leave_type__name
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

export const LEAVE_ALLOCATIONS_QUERY = `
query LeaveAllocationsByEmployee(
  $first: Int!
  $filters: [DBFilterInput!]
) {
  LeaveAllocations(first: $first, filter: $filters) {
    edges {
      node {
        leave_type__name
        total_leaves_allocated
      }
    }
  }
}
`;
export const LEAVE_APPLICATIONS_QUERY = `
query LeaveApplications($first: Int!, $filters: [DBFilterInput!]) {
  LeaveApplications(first: $first, filter: $filters) {
    edges {
      node {
        leave_type__name
        total_leave_days
      }
    }
  }
}
`;

