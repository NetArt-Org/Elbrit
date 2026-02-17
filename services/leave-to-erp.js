import { LOGGED_IN_USER } from "@calendar/components/auth/calendar-users";
import { differenceInCalendarDays, startOfDay, endOfDay, format } from "date-fns";
function toERPDate(date = new Date()) {
  return format(startOfDay(date), "yyyy-MM-dd");
}
export function mapFormToErpLeave(values) {
  const isHalf = values.leavePeriod === "Half";
  const fromDate = toERPDate(values.startDate);
  const toDate = isHalf
    ? fromDate
    : toERPDate(values.endDate);
    const totalDays = calculateTotalLeaveDays(
      values.startDate,
      values.endDate,
      isHalf
    );
    
  return {
    doctype: "Leave Application",
    employee: LOGGED_IN_USER.id,
    leave_type: values.leaveType,
    from_date: fromDate,
    to_date: toDate,
    half_day: isHalf ? 1 : 0,
    half_day_date: isHalf
      ? toERPDate(values.halfDayDate)
      : null,
    total_leave_days: totalDays,
    description: values.description ?? "",
    posting_date: toERPDate(),
    status: "Open",
    follow_via_email: 1,
    fsl_attach: values.medicalAttachment ?? null,
    leave_approver: values.leave_approver ?? null,
  };
}

export function mapErpLeaveToCalendar(leave) {
  if (!leave?.from_date || !leave?.to_date || !leave?.name) return null;

  const start = startOfDay(new Date(`${leave.from_date}T00:00:00`));
  const end = endOfDay(new Date(`${leave.to_date}T00:00:00`));

  const isHalfDay = leave.half_day === 1 || leave.half_day === true;

  const totalDays =
  leave.total_leave_days ??
  calculateTotalLeaveDays(start, end, isHalfDay);

  return {
    erpName: `LEAVE-${leave.name}`,
    id: `LEAVE-${leave.name}`,
    title: leave.leave_type__name || "Leave",
    tags: "Leave",
    leaveType: leave.leave_type__name,
    startDate: start.toISOString(), // ✅ normalized
    endDate: end.toISOString(),     // ✅ normalized
    status: leave.status,
    half_day: isHalfDay ? 1 : 0,
    total_leave_days: totalDays,
    halfDayDate: leave.half_day_date ?? "",
    description: leave.description,
    color: "red",
    medicalAttachment: leave.fsl_attach ?? "",
    employee: leave.employee?.name,
    approvedBy: leave.leave_approver_name ?? "",
    leave_approver:
      typeof leave.leave_approver === "object"
        ? leave.leave_approver?.name
        : leave.leave_approver ?? null,
  };
}


export function calculateTotalLeaveDays(startDate, endDate, isHalfDay) {
  const totalDays =
    differenceInCalendarDays(
      startOfDay(endDate),
      startOfDay(startDate)
    ) + 1;

  return isHalfDay ? totalDays - 0.5 : totalDays;
}