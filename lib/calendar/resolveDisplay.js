import { format, parseISO, isValid } from "date-fns";
import { formatTime } from "@calendar/components/calendar/helpers";

export function resolveDisplayValueFromEvent({
  event,
  field,
  use24HourFormat,
}) {
  const value = event[field.key];

  switch (field.type) {
    case "doctor": {
        return event.event_participants
          ?.filter((p) => p.reference_doctype === "Lead")
          .map((p) => {
            const doc = event._doctorOptions?.find(
              (d) => d.value === p.reference_docname
            );
            return doc?.label ?? p.reference_docname;
          })
          .join(", ");
      }
      
      case "employee": {
        return event.event_participants
          ?.filter((p) => p.reference_doctype === "Employee")
          .map((p) => {
            const emp = event._employeeOptions?.find(
              (e) => e.value === p.reference_docname
            );
            return emp?.label ?? p.reference_docname;
          })
          .join(", ");
      }
      
    case "owner": {
      return event.owner?.name ?? null;
    }

    case "date": {
      const d =
        typeof value === "string" ? parseISO(value) : new Date(value);
      if (!isValid(d)) return null;
      return format(d, "dd/MM/yyyy");
    }

    case "datetime": {
      const d =
        typeof value === "string" ? parseISO(value) : new Date(value);
      if (!isValid(d)) return null;

      return `${format(d, "dd/MM/yyyy")} at ${formatTime(
        d,
        use24HourFormat
      )}`;
    }

    default:
      return value ?? null;
  }
}
