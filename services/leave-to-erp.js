import { LOGGED_IN_USER } from "@/components/auth/calendar-users";

export function mapFormToErpLeave(values) {
    const isHalf = values.leavePeriod === "Half";
  
    return {
      doctype: "Leave Application",
      employee: LOGGED_IN_USER.employee,
      company: LOGGED_IN_USER.company,
      leave_type: values.leaveType,
      from_date: values.startDate,
      to_date: isHalf ? values.startDate : values.endDate,
      half_day: isHalf ? 1 : 0,
      half_day_date: isHalf ? values.startDate : null,
    //   total_leave_days: isHalf
    //     ? 0.5
    //     : differenceInCalendarDays(values.endDate, values.startDate) + 1,
      description: values.description,
      posting_date: new Date(),
      status: "Open",
      follow_via_email: 1,
      fsl_attach: values.medicalAttachment ?? null,
    };
  }
  
  export function mapErpLeaveToCalendar(leave) {
    return {
      id: leave.name,
      title: leave.leave_type__name + " Leave",
      startDate: leave.from_date,
      endDate: leave.to_date,
      allDay: true,
      tags: "Leave",
      color: "#2563eb",
    };
  }
  