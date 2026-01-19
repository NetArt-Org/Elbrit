import { PARTICIPANT_SOURCE_BY_TAG } from "@/components/calendar/mocks";
import {
  fetchEmployees,
  fetchSalesPartner,fetchHQTerritories
} from "@/services/participants.service";

/**
 * Fetch employee / sales partner options based on selected tag
 */
export async function loadParticipantOptionsByTag({
  tag,
  employeeOptions,
  salesPartnerOptions,
  hqTerritoryOptions,
  setEmployeeOptions,
  setSalesPartnerOptions,
  setHqTerritoryOptions,
}) {
  if (!tag) return;

  const sources = PARTICIPANT_SOURCE_BY_TAG[tag] || [];

  if (sources.includes("EMPLOYEE") && employeeOptions.length === 0) {
    const employees = await fetchEmployees();
    setEmployeeOptions(employees);
  }

  if (sources.includes("SALESPARTNER") && salesPartnerOptions.length === 0) {
    const partners = await fetchSalesPartner();
    setSalesPartnerOptions(partners);
  }

  if (sources.includes("HQ_TERRITORY") && hqTerritoryOptions.length === 0) {
    const hqs = await fetchHQTerritories();
    setHqTerritoryOptions(hqs);
  }
}

/**
 * Prefill participant fields in edit mode
 */
export function setParticipantFormDefaults({ isOpen, event, form }) {
  if (!isOpen || !event?.participants?.length) return;

  const employee = event.participants.find(
    (p) => p.type === "Employee"
  );

  const salesPartner = event.participants.find(
    (p) => p.type === "Sales Partner"
  );

  if (employee) {
    form.setValue("employees", employee.id);
  }

  if (salesPartner) {
    form.setValue("salesPartner", salesPartner.id);
  }
}
