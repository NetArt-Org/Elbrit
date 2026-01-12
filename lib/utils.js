import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function buildCalendarParticipants(values, employeeOptions, doctorOptions) {
  const participants = [];

  if (values.employees) {
    const emp = employeeOptions.find(e => e.value === values.employees);

    participants.push({
      type: "Employee",
      id: values.employees,
      label: emp?.label || values.employees,
    });
  }

  if (values.salesPartner) {
    const doc = doctorOptions.find(d => d.value === values.salesPartner);

    participants.push({
      type: "Sales Partner",
      id: values.salesPartner,
      label: doc?.label || values.salesPartner,
    });
  }

  return participants;
}
