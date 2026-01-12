import { format } from "date-fns";
import { COLOR_HEX_MAP } from "@/components/calendar/constants";

/**
 * Maps form values to an ERP Event document
 * - Handles create & update
 * - Adds name only when editing
 */
export function mapFormToErpEvent(values, options = {}) {
  
  const { erpName } = options;

  function buildParticipants(values) {
    const participants = [];
  
    if (values.employees) {
      participants.push({
        reference_doctype: "Employee",
        reference_docname: values.employees,
      });
    }
  
    if (values.salesPartner) {
      participants.push({
        reference_doctype: "Sales Partner",
        reference_docname: values.salesPartner,
      });
    }
  
    return participants;
  }
  

  const doc = {
    doctype: "Event",
    subject: values.title,
    description: values.description,
    starts_on: format(values.startDate, "yyyy-MM-dd HH:mm:ss"),
    ends_on: format(values.endDate, "yyyy-MM-dd HH:mm:ss"),
    event_category: values.tags,
    color: COLOR_HEX_MAP[values.color] ?? COLOR_HEX_MAP.blue,
    all_day: 0,
    event_type: "Public",
    status: "Open",
    docstatus: 0,
    event_participants: buildParticipants(values),
  };

  // Only include name for UPDATE
  if (erpName) {
    doc.name = erpName;
  }

  return doc;
}


export function serializeEventDoc(doc) {
    return JSON.stringify(doc);
  }
  