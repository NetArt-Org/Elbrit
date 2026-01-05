import { graphqlRequest } from "@/lib/graphql-client";
import { serializeEventDoc } from "./event.mapper";

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
  if (!doc) {
    throw new Error("Event payload is missing");
  }

  const data = await graphqlRequest(SAVE_EVENT_MUTATION, {
    doc: serializeEventDoc(doc),
  });

  if (!data?.saveDoc?.doc?.name) {
    throw new Error("ERP did not return Event name");
  }

  return data.saveDoc.doc;
}
