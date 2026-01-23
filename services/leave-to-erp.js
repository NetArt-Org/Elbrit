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
    console.log("VALUE",values)
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
  const from = startOfDay(new Date(leave.from_date));
  const to = endOfDay(new Date(leave.to_date));

  return {
    id: leave.name,
    leaveType: leave.leave_type,
    startDate: from,
    endDate: to,
    tags: "Leave",
    status: leave.status,
    color: "#2563eb",
    description: leave.description,
  };
}