"use client";

import React, { useMemo } from "react";
import { isSameDay, parseISO } from "date-fns";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { useMediaQuery } from "./hooks";

import { CalendarMonthView } from "@/components/calendar/views/month-view/calendar-month-view";
import { CalendarWeekView } from "@/components/calendar/views/week-and-day-view/calendar-week-view";
import { CalendarDayView } from "@/components/calendar/views/week-and-day-view/calendar-day-view";

import { AgendaEvents } from "@/components/calendar/views/agenda-view/agenda-events";
import { AgendaEventsMobile } from "./views/agenda-view/AgendaEventsMobile";
import { CalendarMobileWeekAgenda } from "./views/week-and-day-view/calendar-mobile-week-agenda";

import MobileAddEventBar from "./mobile/MobileAddEventBar";

export function CalendarBody() {
  const { view, events, mobileLayer } = useCalendar();
  const isMobile = useMediaQuery("(max-width: 768px)");

  /* ===============================
     EVENT NORMALIZATION
  =============================== */
  const { singleDayEvents, multiDayEvents } = useMemo(() => {
    const single = [];
    const multi = [];

    for (const event of events) {
      const isSingleDay = isSameDay(
        parseISO(event.startDate),
        parseISO(event.endDate)
      );

      isSingleDay ? single.push(event) : multi.push(event);
    }

    return { singleDayEvents: single, multiDayEvents: multi };
  }, [events]);

  const sharedProps = { singleDayEvents, multiDayEvents };

  /* ===============================
     SHARED VIEWS (DESKTOP + MOBILE)
     Year view intentionally removed
  =============================== */
  const sharedViews = {
    month: <CalendarMonthView {...sharedProps} />,
  };

  /* ===============================
     DESKTOP-SPECIFIC VIEWS
  =============================== */
  const desktopViews = {
    week: <CalendarWeekView {...sharedProps} />,
    day: <CalendarDayView {...sharedProps} />,
    agenda: <AgendaEvents />,
  };

  /* ===============================
     MOBILE-SPECIFIC VIEWS
  =============================== */
  const mobileViews = {
    week: <CalendarMobileWeekAgenda {...sharedProps} />,
    agenda: <AgendaEventsMobile />,
  };

  /* ===============================
     VIEW RESOLUTION
  =============================== */
  const resolveDesktopView = () =>
    sharedViews[view] ??
    desktopViews[view] ??
    null;

  const resolveMobileView = () => {
    if (
      mobileLayer === "month-expanded" ||
      mobileLayer === "month-agenda"
    ) {
      return sharedViews.month;
    }

    return (
      sharedViews[mobileLayer] ??
      mobileViews[mobileLayer] ??
      null
    );
  };

  /* ===============================
     RENDER
  =============================== */
  if (!isMobile) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative w-full">
        {resolveDesktopView()}
        <MobileAddEventBar />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full pb-[80px] overflow-hidden relative w-full custom-class">
      {resolveMobileView()}
      <MobileAddEventBar />
    </div>
  );
}
