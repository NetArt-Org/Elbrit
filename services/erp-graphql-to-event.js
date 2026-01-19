import { eventSchema } from "@/components/calendar/schemas";
import { COLOR_HEX_MAP } from "@/components/calendar/constants";
/**
 * ERP GraphQL → Calendar Event
 * Ensures startDate / endDate are ISO STRINGS
 */
export function mapErpGraphqlEventToCalendar(node) {
  const participants =
  node.event_participants?.map(p => ({
    type: p.reference_doctype?.name, // "Employee" | "Sales Partner"
    id: p.reference_docname__name,    // "E00851" | "SP-0003"
  })) ?? [];

    if (!node) return null;
  
    const startDate = parseErpDate(node.starts_on);

// ERP drops ends_on when same-day → normalize here
const endDate =
  parseErpDate(node.ends_on) ?? startDate;

  
    const event = {
      erpName: node.name,
      title: node.subject || "",
      // ERP may return null
      description: node.description ?? "",
      // ✅ MUST be ISO strings (not Date objects)
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      color: mapHexToColor(node.color),
      tags: node.event_category || "Other",
      hqTerritory: node.fsl_territory?.name ?? "",
      owner: node.owner
        ? {
            id: node.owner.name,
            name: node.owner.full_name || node.owner.name,
            email: node.owner.email,
          }
        : undefined,
      isMultiDay:
        startDate &&
        endDate &&
        startDate.toDateString() !== endDate.toDateString(),
        participants,
    };
  
    const parsed = eventSchema.safeParse({
      ...event,
      // Zod expects Date objects → validate separately
      startDate: startDate,
      endDate: endDate,
    });
  
    if (!parsed.success) {
      console.error("Invalid ERP event ZodError:", parsed.error.issues, node);
      return null;
    }
  
    return event; // ← return ISO-string version
  }
  
  /**
   * ERP format: "YYYY-MM-DD HH:mm:ss"
   * Convert safely to Date
   */
  function parseErpDate(value) {
    if (!value || typeof value !== "string") return null;
  
    const isoLike = value.replace(" ", "T");
    const date = new Date(isoLike);
  
    return isNaN(date.getTime()) ? null : date;
  }
  
  function mapHexToColor(hex) {
    if (!hex) return "blue";
  
    const entry = Object.entries(COLOR_HEX_MAP).find(
      ([, value]) => value.toLowerCase() === hex.toLowerCase()
    );
  
    return entry ? entry[0] : "blue";
  }