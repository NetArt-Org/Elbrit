"use client";

import { useState } from "react";
import { Menu, Search, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarSidebar } from "./calendar-sidebar";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";

export function MobileCalendarHeader() {
  const [open, setOpen] = useState(false);
  const { currentDate } = useCalendar();

  return (
    <>
      <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
        {/* Left – Hamburger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

       

        {/* Right – Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <CheckSquare className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <CalendarSidebar open={open} onOpenChange={setOpen} />
    </>
  );
}
