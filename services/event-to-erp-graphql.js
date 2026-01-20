import { format } from "date-fns";
import { COLOR_HEX_MAP } from "@/components/calendar/constants";
import { LOGGED_IN_USER } from "@/components/auth/calendar-users";

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
  
    if (values.doctor) {
      participants.push({
        reference_doctype: "Lead",
        reference_docname: values.doctor,
      });
    }
  
    return participants;
  }
  const isBirthday = values.tags === "Birthday";
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
    fsl_territory:values.hqTerritory || "",
  };
  /* ------------------------------------
     🎂 Birthday repeat logic (ERP)
  ------------------------------------ */
  if (isBirthday) {
    doc.repeat_this_event = 1;
    doc.repeat_on = "Yearly";
  }
  if (!erpName) {
    doc.owner = LOGGED_IN_USER.id;
  }
  // Only include name for UPDATE
  if (erpName) {
    doc.name = erpName;
  }

  return doc;
}


export function serializeEventDoc(doc) {
    return JSON.stringify(doc);
  }
  