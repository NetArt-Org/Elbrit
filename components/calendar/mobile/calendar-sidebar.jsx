"use client";

import { CalendarDays, LayoutGrid, List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";

export function CalendarSidebar({ open, onOpenChange }) {
  const { setView } = useCalendar();

  const handleViewChange = (view) => {
    setView(view);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>Scheduler</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-2">
          <Button
            variant="ghost"
            className="justify-start gap-2"
            // onClick={() => handleViewChange("schedule")}
          >
            <List className="h-4 w-4" />
            Schedule
          </Button>

          <Button
            variant="ghost"
            className="justify-start gap-2"
            // onClick={() => handleViewChange("day")}
          >
            <CalendarDays className="h-4 w-4" />
            Day
          </Button>

          <Button
            variant="ghost"
            className="justify-start gap-2"
            // onClick={() => handleViewChange("week")}
          >
            <LayoutGrid className="h-4 w-4" />
            Week
          </Button>

          <Button
            variant="ghost"
            className="justify-start gap-2"
            // onClick={() => handleViewChange("month")}
          >
            <LayoutGrid className="h-4 w-4" />
            Month
          </Button>
        </nav>

      </SheetContent>
    </Sheet>
  );
}
