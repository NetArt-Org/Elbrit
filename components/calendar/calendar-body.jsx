"use client";

import { isSameDay, parseISO } from "date-fns";
import React from "react";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { AgendaEvents } from "@/components/calendar/views/agenda-view/agenda-events";
import { CalendarMonthView } from "@/components/calendar/views/month-view/calendar-month-view";
import { CalendarDayView } from "@/components/calendar/views/week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "@/components/calendar/views/week-and-day-view/calendar-week-view";
import { CalendarYearView } from "@/components/calendar/views/year-view/calendar-year-view";
import MobileAddEventBar from "./mobile/MobileAddEventBar";
import { useMediaQuery } from "./hooks";
import { CalendarMobileWeekAgenda } from "./views/week-and-day-view/calendar-mobile-week-agenda";
import { CalendarVerticalSwipeLayer } from "@/components/calendar/mobile/CalendarVerticalSwipeLayer";

export function CalendarBody() {
  const { view, events, mobileLayer } = useCalendar();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const singleDayEvents = events.filter((event) =>
    isSameDay(parseISO(event.startDate), parseISO(event.endDate))
  );

  const multiDayEvents = events.filter(
    (event) =>
      !isSameDay(parseISO(event.startDate), parseISO(event.endDate))
  );

  // DESKTOP — unchanged
  if (!isMobile) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative w-full">
        {view === "month" && (
          <CalendarMonthView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "week" && (
          <CalendarWeekView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "day" && (
          <CalendarDayView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "year" && (
          <CalendarYearView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "agenda" && <AgendaEvents />}
        <MobileAddEventBar />
      </div>
    );
  }

  // 📱 MOBILE — wrapped with vertical swipe
  return (
    <CalendarVerticalSwipeLayer>
      <div className="flex-1 min-h-0 flex flex-col h-full pb-[80px] overflow-hidden relative w-full custom-class">
        {mobileLayer === "year" && (
          <CalendarYearView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}

        {(mobileLayer === "month-expanded" ||
          mobileLayer === "month-agenda") && (
          <CalendarMonthView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}

        {mobileLayer === "week" && (
          <CalendarMobileWeekAgenda
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}

        {mobileLayer === "agenda" && <AgendaEvents />}

        <MobileAddEventBar />
      </div>
    </CalendarVerticalSwipeLayer>
  );
}
