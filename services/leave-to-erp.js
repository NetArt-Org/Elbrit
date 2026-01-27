import { LOGGED_IN_USER } from "@/components/auth/calendar-users";
import { differenceInCalendarDays, startOfDay, endOfDay } from "date-fns";
function toERPDate(date = new Date()) {
  return date.toISOString().split("T")[0];
}
export function mapFormToErpLeave(values) {
  const isHalf = values.leavePeriod === "Half";
  const fromDate = toERPDate(values.startDate);
  const toDate = isHalf
    ? fromDate
    : toERPDate(values.endDate);
  return {
    doctype: "Leave Application",
    employee: LOGGED_IN_USER.id,
    leave_type: values.leaveType,

    from_date: fromDate,
    to_date: toDate,

    half_day: isHalf ? 1 : 0,
    half_day_date: isHalf ? fromDate : null,

    total_leave_days: isHalf
      ? 0.5
      : differenceInCalendarDays(toDate, fromDate) + 1,

    description: values.description ?? "",
    posting_date: toERPDate(),
    status: "Open",
    follow_via_email: 1,
    fsl_attach: values.medicalAttachment ?? null,
  };
}

export function mapErpLeaveToCalendar(leave) {
  if (!leave?.from_date || !leave?.to_date || !leave?.name) return null;

  const start = startOfDay(
    new Date(`${leave.from_date}T00:00:00`)
  );

  const end = endOfDay(
    new Date(`${leave.to_date}T00:00:00`)
  );

  return {
    id: `LEAVE-${leave.name}`,
    title: leave.leave_type__name || "Leave",
    tags: "Leave",
    leaveType: leave.leave_type__name,
    startDate: start.toISOString(), // ✅ normalized
    endDate: end.toISOString(),     // ✅ normalized
    status: leave.status,
    description: leave.description,
    color: "red",
    allDay: true,
  };
}