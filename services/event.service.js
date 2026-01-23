import { graphqlRequest } from "@/lib/graphql-client";
import { serializeEventDoc } from "./event-to-erp-graphql";
import { EVENTS_BY_RANGE_QUERY, LEAVE_ALLOCATIONS_QUERY, LEAVE_APPLICATIONS_QUERY } from "@/services/events.query";
import { mapErpGraphqlEventToCalendar } from "@/services/erp-graphql-to-event";
import { getCachedEvents, setCachedEvents } from "@/lib/calendar/event-cache";
import { buildRangeCacheKey } from "@/lib/calendar/cache-key";
import { clearEventCache } from "@/lib/calendar/event-cache";
import {
  getCachedLeaveBalance,
  setCachedLeaveBalance,
  getLeaveCacheKey,
  clearLeaveCache,
} from "@/lib/leave/leave-cache";
const PAGE_SIZE = 50;

const SAVE_EVENT_MUTATION = `
mutation SaveEvent($doc: String!) {
  saveDoc(doctype: "Event", doc: $doc) {
    doc {
      name
    }
  }
}
`;
const SAVE_EVENT_TODO = `
mutation SaveEvent($doc: String!) {
  saveDoc(doctype: "ToDo", doc: $doc) {
    doc {
      name
    }
  }
}
`;
const SAVE_LEAVE_APPLICATION_MUTATION = `
mutation SaveEvent($doc: String!) {
  saveDoc(doctype: "LeaveApplication", doc: $doc) {
    doc {
      name
    }
  }
}
`;

export async function saveEvent(doc) {
  const data = await graphqlRequest(SAVE_EVENT_MUTATION, {
    doc: serializeEventDoc(doc),
  });

  if (!data?.saveDoc?.doc?.name) {
    throw new Error("ERP did not return Event name");
  }
  // invalidate cache only after successful write
  clearEventCache();

  return data.saveDoc.doc;
}
export async function saveDocToErp(doc) {
  const data = await graphqlRequest(SAVE_EVENT_TODO, {
    doc: JSON.stringify(doc),
  });

  if (!data?.saveDoc?.doc?.name) {
    throw new Error("ERP did not return document name");
  }

  clearEventCache();
  return data.saveDoc.doc;
}

export async function saveLeaveApplication(doc) {
  const data = await graphqlRequest(SAVE_LEAVE_APPLICATION_MUTATION, {
    doc: JSON.stringify(doc),
  });

  if (!data?.saveDoc?.doc?.name) {
    throw new Error("Failed to create Leave Application");
  }

  clearLeaveCache();
  return data.saveDoc.doc;
}


export async function fetchEventsByRange(startDate, endDate, view) {
  const cacheKey = buildRangeCacheKey(view, startDate, endDate);

  const cached = getCachedEvents(cacheKey);
  if (cached) {
    return cached;
  }

  let after = null;
  let events = [];

  // ✅ MUST match DBFilterInput exactly
  const filter = [
    {
      fieldname: "starts_on",
      operator: "LTE",
      value: endDate.toISOString(),
    },
    {
      fieldname: "ends_on",
      operator: "GTE",
      value: startDate.toISOString(),
    },
  ];

  while (true) {
    const data = await graphqlRequest(EVENTS_BY_RANGE_QUERY, {
      first: PAGE_SIZE,
      after,
      filter, // ✅ correct variable name
    });

    const connection = data?.Events;
    if (!connection) break;

    // ✅ ALWAYS read from edges[].node
    const pageEvents = connection.edges
      .map(edge => mapErpGraphqlEventToCalendar(edge.node))
      .filter(Boolean);

    events.push(...pageEvents);

    if (!connection.pageInfo || !connection.pageInfo.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }

  setCachedEvents(cacheKey, events);
  return events;
}

const DELETE_EVENT_MUTATION = `
mutation DeleteEvent($doctype: String!, $name: String!) {
  deleteDoc(doctype: $doctype, name: $name) {
    name
  }
}
`;

export async function deleteEventFromErp(erpName) {
  if (!erpName) return true;

  try {
    const data = await graphqlRequest(DELETE_EVENT_MUTATION, {
      doctype: "Event",
      name: erpName,
    });

    // Success path
    clearEventCache();
    return true;

  } catch (error) {
    const message = error?.message || "";

    // ✅ ERP already deleted → treat as success
    if (
      message.includes("not found") ||
      message.includes("does not exist") ||
      message.includes("Missing document")
    ) {
      clearEventCache();
      return true;
    }

    // ❌ real error
    throw error;
  }
}

// ---------------------------------------------
// Leave Filters
// ---------------------------------------------
const getLeaveAllocationFilters = (employeeId) => [
  { fieldname: "employee", operator: "EQ", value: employeeId },
  { fieldname: "docstatus", operator: "EQ", value: "1" },
];

const getLeaveUsedFilters = (employeeId) => [
  { fieldname: "employee", operator: "EQ", value: employeeId },
  { fieldname: "status", operator: "EQ", value: "Approved" },
  { fieldname: "docstatus", operator: "EQ", value: "1" },
];

const getLeavePendingFilters = (employeeId) => [
  { fieldname: "employee", operator: "EQ", value: employeeId },
  { fieldname: "status", operator: "EQ", value: "Open" },
];

/* =====================================================
   EMPLOYEE LEAVE BALANCE (WITH CACHE)
===================================================== */
export async function fetchEmployeeLeaveBalance(employeeId) {
  const cacheKey = getLeaveCacheKey(employeeId);
  const cached = getCachedLeaveBalance(cacheKey);

  // ⏱ 5-minute TTL
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
    return cached.data;
  }

  const [allocRes, usedRes, pendingRes] = await Promise.all([
    graphqlRequest(LEAVE_ALLOCATIONS_QUERY, {
      first: 20,
      filters: getLeaveAllocationFilters(employeeId),
    }),
    graphqlRequest(LEAVE_APPLICATIONS_QUERY, {
      first: 100,
      filters: getLeaveUsedFilters(employeeId),
    }),
    graphqlRequest(LEAVE_APPLICATIONS_QUERY, {
      first: 100,
      filters: getLeavePendingFilters(employeeId),
    }),
  ]);

  const balance = {};

  allocRes.LeaveAllocations.edges.forEach(({ node }) => {
    balance[node.leave_type__name] = {
      allocated: node.total_leaves_allocated,
      used: 0,
      pending: 0,
    };
  });

  usedRes.LeaveApplications.edges.forEach(({ node }) => {
    if (balance[node.leave_type__name]) {
      balance[node.leave_type__name].used += node.total_leave_days;
    }
  });

  pendingRes.LeaveApplications.edges.forEach(({ node }) => {
    if (balance[node.leave_type__name]) {
      balance[node.leave_type__name].pending += node.total_leave_days;
    }
  });

  Object.values(balance).forEach((b) => {
    b.available = b.allocated - b.used - b.pending;
  });

  setCachedLeaveBalance(cacheKey, balance);
  return balance;
}