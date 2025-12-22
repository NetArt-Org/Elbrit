"use client";

import React, { useEffect, useState } from "react";

import { CalendarBody } from "@/components/calendar/calendar-body";
import { CalendarProvider } from "@/components/calendar/contexts/calendar-context";
import { DndProvider } from "@/components/calendar/contexts/dnd-context";
import { CalendarHeader } from "@/components/calendar/header/calendar-header";
import { getEvents, getUsers } from "@/components/calendar/requests";
import { motion } from "framer-motion";
import { MobileCalendarHeader } from "./mobile/mobile-calendar-header";

export function Calendar() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <div className="w-full h-full  rounded-xl">
          <MobileCalendarHeader />
          <CalendarHeader />
          <CalendarBody />
        </div>
      </DndProvider>
    </CalendarProvider>
  );
}
