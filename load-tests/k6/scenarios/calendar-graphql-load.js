import { check, group, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE_OPTIONS, buildArrivalRateScenario, numberEnv } from "../lib/config.js";
import { graphqlRequest, safeJson } from "../lib/graphql.js";

const calendarBootstrapTrend = new Trend("calendar_bootstrap_duration", true);
const calendarRangeTrend = new Trend("calendar_range_duration", true);

const EVENTS_BY_RANGE_QUERY = `
query EventsByRange(
  $first: Int!
  $filters: [DBFilterInput!]
) {
  Events(first: $first, filter: $filters) {
    edges {
      node {
        name
        subject
        starts_on
        ends_on
        event_category
        color
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}
`;

const ROLE_PROFILES_QUERY = `
query RoleProfiles($first: Int) {
  RoleProfiles(first: $first) {
    edges {
      node {
        role_id: custom_role_profile
        is_group
        custom_department {
          department_name
          lft
          rgt
          parent_department__name
        }
      }
    }
  }
}
`;

const EMPLOYEES_QUERY = `
query GetEmployees($first: Int!, $filters: [DBFilterInput!]) {
  Employees(first: $first, filter: $filters) {
    edges {
      node {
        name
        employee_name
        company_email
        user_id: user_id__name
        role_id: custom_role_profile
      }
    }
  }
}
`;

const CUSTOMERS_QUERY = `
query Customers($first: Int!) {
  Customers(first: $first) {
    edges {
      node {
        name
        territory__name
      }
    }
  }
}
`;

function isoUtc(year, monthIndex, day, hours = 0, minutes = 0, seconds = 0) {
  return new Date(Date.UTC(year, monthIndex, day, hours, minutes, seconds)).toISOString();
}

function monthWindow(anchorDate) {
  const date = new Date(anchorDate);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const start = isoUtc(year, month, 1, 0, 0, 0);
  const end = isoUtc(year, month + 1, 0, 23, 59, 59);
  return { start, end };
}

function randomMonthAnchor() {
  const year = numberEnv("TEST_YEAR", 2026);
  const month = Math.floor(Math.random() * 12);
  return new Date(Date.UTC(year, month, 15, 12, 0, 0));
}

export const options = {
  ...BASE_OPTIONS,
  scenarios: {
    calendar_graphql_load: buildArrivalRateScenario({
      rate: 100,
      duration: "5m",
      preAllocatedVUs: 50,
      maxVUs: 300,
    }),
  },
};

export function setup() {
  group("calendar bootstrap", () => {
    let response = graphqlRequest(
      ROLE_PROFILES_QUERY,
      { first: numberEnv("ROLE_PAGE_SIZE", 1000) },
      { name: "role_profiles" }
    );
    calendarBootstrapTrend.add(response.timings.duration);
    check(response, {
      "role profiles returned": (res) =>
        Array.isArray(safeJson(res)?.data?.RoleProfiles?.edges),
    });

    response = graphqlRequest(
      EMPLOYEES_QUERY,
      { first: numberEnv("EMPLOYEE_PAGE_SIZE", 1000), filters: [] },
      { name: "employees" }
    );
    calendarBootstrapTrend.add(response.timings.duration);
    check(response, {
      "employees returned": (res) =>
        Array.isArray(safeJson(res)?.data?.Employees?.edges),
    });

    response = graphqlRequest(
      CUSTOMERS_QUERY,
      { first: numberEnv("CUSTOMER_PAGE_SIZE", 500) },
      { name: "customers" }
    );
    calendarBootstrapTrend.add(response.timings.duration);
    check(response, {
      "customers returned": (res) =>
        Array.isArray(safeJson(res)?.data?.Customers?.edges),
    });
  });
}

export default function () {
  group("calendar month fetch", () => {
    const anchorDate = randomMonthAnchor();
    const { start, end } = monthWindow(anchorDate);

    const response = graphqlRequest(
      EVENTS_BY_RANGE_QUERY,
      {
        first: numberEnv("EVENT_PAGE_SIZE", 500),
        filters: [
          {
            fieldname: "starts_on",
            operator: "LTE",
            value: end,
          },
        ],
      },
      { name: "events_by_range" }
    );

    calendarRangeTrend.add(response.timings.duration);
    check(response, {
      "events query returned data": (res) =>
        Array.isArray(safeJson(res)?.data?.Events?.edges),
    });
  });

  sleep(numberEnv("SLEEP_SECONDS", 0.2));
}
