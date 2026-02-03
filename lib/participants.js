import { PARTICIPANT_SOURCE_BY_TAG } from "@/components/calendar/mocks";
import {
  fetchEmployees,fetchDoctors,fetchHQTerritories
} from "@/services/participants.service";
import { getCached } from "./participants-cache";
/**
 * Fetch employee / sales partner options based on selected tag
 */
export async function loadParticipantOptionsByTag({
  tag,
  employeeOptions,
  hqTerritoryOptions,
  doctorOptions,
  setEmployeeOptions,
  setDoctorOptions,
  setHqTerritoryOptions,
}) {
  if (!tag) return;

  const sources = PARTICIPANT_SOURCE_BY_TAG[tag] || [];

  if (sources.includes("EMPLOYEE") && employeeOptions.length === 0) {
    const employees = await getCached("EMPLOYEE", fetchEmployees);
    setEmployeeOptions(employees);
  }

  if (sources.includes("DOCTOR") && doctorOptions.length === 0) {
    const doctors = await getCached("DOCTOR", fetchDoctors);
    setDoctorOptions(doctors);
  }

  if (
    sources.includes("HQ_TERRITORY") &&
    hqTerritoryOptions.length === 0
  ) {
    const hqs = await getCached("HQ_TERRITORY", fetchHQTerritories);
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

  const doctor = event.participants.find(
    (p) => p.type === "Doctor"
  );

  if (employee) {
    form.setValue("employees", employee.id);
  }

  if (doctor) {
    form.setValue("doctor", doctor.id);
  }
}
