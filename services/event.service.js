import { graphqlRequest } from "@/lib/graphql-client";
import { serializeEventDoc } from "./event.mapper";
import { EVENTS_BY_RANGE_QUERY } from "@/services/events.query";
import { mapErpGraphqlEventToCalendar } from "@/services/erp-graphql-to-event";
import { getCachedEvents, setCachedEvents } from "@/lib/calendar/event-cache";
import { buildRangeCacheKey } from "@/lib/calendar/cache-key";
import { clearEventCache } from "@/lib/calendar/event-cache";

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
