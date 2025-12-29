"use client";

import React, { useEffect, useState } from "react";
import { CalendarBody } from "@/components/calendar/calendar-body";
import { CalendarProvider } from "@/components/calendar/contexts/calendar-context";
import { DndProvider } from "@/components/calendar/contexts/dnd-context";
import { CalendarHeader } from "@/components/calendar/header/calendar-header";
import { getEvents, getUsers } from "@/components/calendar/requests";
import { MobileCalendarHeader } from "./mobile/mobile-calendar-header";
import { useMediaQuery } from "@/components/calendar/hooks";
import { AgendaSidebar } from "./views/agenda-view/agenda-sidebar";

export function Calendar() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    async function loadData() {
      try {
        const [eventsData, usersData] = await Promise.all([
          getEvents(),
          getUsers(),
        ]);
        setEvents(eventsData);
        setUsers(usersData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-6 text-center text-sm text-muted-foreground">
        Loading calendar…
      </div>
    );
  }

  return (
    <CalendarProvider events={events} users={users} view="month">
      <DndProvider showConfirmation={false}>
        <div className="h-screen w-full overflow-hidden flex flex-col">
          {isMobile ? <MobileCalendarHeader /> : <CalendarHeader />}

          {/* ===== Desktop Split Layout ===== */}
          <div className="flex flex-1 overflow-hidden">
            {!isMobile && (
              <aside className="w-[20%] min-w-[280px] border-r bg-background">
               <AgendaSidebar />
              </aside>
            )}

            <main className="flex-1 overflow-hidden">
              <CalendarBody />
            </main>
          </div>
        </div>
      </DndProvider>
    </CalendarProvider>
  );
}
