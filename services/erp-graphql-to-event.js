import { eventSchema } from "@/components/calendar/schemas";
import { COLOR_HEX_MAP } from "@/components/calendar/constants";
/**
 * ERP GraphQL → Calendar Event
 * Ensures startDate / endDate are ISO STRINGS
 */
export function mapErpGraphqlEventToCalendar(node) {
  if (!node) return null;
  const isBirthday = node.event_category === "Birthday";

  const participants =
    node.event_participants?.map(p => ({
      type: p.reference_doctype?.name,
      id: p.reference_docname__name,
    })) ?? [];

  // ✅ extract sales partner explicitly
  const doctor =
    participants.find(p => p.type === "Lead")?.id;

    let startDate = parseErpDate(node.starts_on);
    let endDate = parseErpDate(node.ends_on) ?? startDate;
    
    if (isBirthday && startDate) {
      const currentYear = new Date().getFullYear();
    
      const normalized = new Date(startDate);
      normalized.setFullYear(currentYear);
    
      startDate = normalized;
      endDate = normalized;
    }
    

  const event = {
    erpName: node.name,
    title: node.subject || "",
    description: node.description ?? "",
    startDate: startDate ? startDate.toISOString() : null,
    endDate: endDate ? endDate.toISOString() : null,
    color: mapHexToColor(node.color),
    tags: node.event_category || "Other",

    // ✅ FIXED
    doctor,

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
    startDate,
    endDate,
  });

  if (!parsed.success) {
    console.error("Invalid ERP event ZodError:", parsed.error.issues, node);
    return null;
  }

  return event;
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