"use client";

import { useState } from "react";
import { Menu, Search, CheckSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarSidebar } from "./calendar-sidebar";
import { AgendaEvents } from "@/components/calendar/views/agenda-view/agenda-events";

export function MobileCalendarHeader() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* HEADER */}
      <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
        {/* Left – Hamburger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Right – Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen((prev) => !prev)}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <CheckSquare className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* INLINE SEARCH PANEL */}
      {searchOpen && (
        <div className="md:hidden border-b bg-background">

          {/* Reuse your existing Agenda search */}
          <AgendaEvents />
        </div>
      )}

      {/* SIDEBAR */}
      <CalendarSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />
    </>
  );
}
