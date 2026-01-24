import { eventSchema } from "@/components/calendar/schemas";
import { COLOR_HEX_MAP } from "@/components/calendar/constants";
import { TAG_FORM_CONFIG } from "@/lib/calendar/form-config";

/**
 * ERP GraphQL → Calendar Event
 * Employees & Doctors are derived ONLY from participants
 */

export function toTitleCase(value = "") {
  const cleaned = value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const words = cleaned.split(" ");

  return words
    .map(word => {
      // preserve known acronyms
      if (word === "hq") return "HQ";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}


export function mapErpGraphqlEventToCalendar(node) {
  if (!node) return null;

  const tag = node.event_category || "Other";
  const tagConfig = TAG_FORM_CONFIG[tag] ?? TAG_FORM_CONFIG.DEFAULT;
  const isBirthday = tag === "Birthday";

  /* ---------------------------------------------
     PARTICIPANTS (SOURCE OF TRUTH)
  --------------------------------------------- */
  const participants =
  node.event_participants?.map((p) => ({
    type: p.reference_doctype?.name,
    id: String(p.reference_docname__name), // 🔒 force scalar
  })) ?? [];


  /* ---------------------------------------------
     DERIVE EMPLOYEES & DOCTORS
  --------------------------------------------- */
  const employees = participants
    .filter((p) => p.type === "Employee")
    .map((p) => p.id);

  const doctors = participants
    .filter((p) => p.type === "Lead")
    .map((p) => p.id);

  /* ---------------------------------------------
     DATE HANDLING
  --------------------------------------------- */
  let startDate = parseErpDate(node.starts_on);
  let endDate = parseErpDate(node.ends_on) ?? startDate;

  // 🎂 Birthday normalization
  if (isBirthday && startDate) {
    const currentYear = new Date().getFullYear();
    startDate = new Date(startDate);
    startDate.setFullYear(currentYear);
    endDate = startDate;
  }

  /* ---------------------------------------------
     EVENT OBJECT (SCHEMA-SAFE)
  --------------------------------------------- */
  const event = {
    erpName: node.name,
    title: node.subject || "",
    description: node.description ?? "",

    startDate: startDate ? startDate.toISOString() : null,
    endDate: endDate ? endDate.toISOString() : null,

    tags: toTitleCase(tag),

    // ✅ REQUIRED BY eventSchema
    employees: tagConfig.employee?.multiselect
      ? employees
      : employees[0] ?? undefined,

    doctor: tagConfig.doctor?.multiselect
      ? doctors
      : doctors[0] ?? undefined,

    color:
      tagConfig.fixedColor ??
      mapHexToColor(node.color) ??
      "blue",

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

    // 🔁 Always keep original participants
    participants,
  };

  /* ---------------------------------------------
     VALIDATE AGAINST SCHEMA
  --------------------------------------------- */
  const parsed = eventSchema.safeParse({
    ...event,
    startDate,
    endDate,
  });

  if (!parsed.success) {
    console.error(
      "Invalid ERP event ZodError:",
      parsed.error.issues,
      node
    );
    return null;
  }

  return event;
}

/* ---------------------------------------------
   HELPERS
--------------------------------------------- */

/**
 * ERP format: "YYYY-MM-DD HH:mm:ss"
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
