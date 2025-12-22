"use client";

import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { cn } from "@/lib/utils";
import { tabs } from "../header/view-tabs";
export function CalendarSidebar({ open, onOpenChange }) {
    const { view, setView } = useCalendar();

    const handleViewChange = (value) => {
        setView(value);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b px-4 py-3 text-left">
                    <SheetTitle>Scheduler</SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-1 p-2">
                    {tabs.map(({ name, value, icon: Icon }) => {
                        const isActive = view === value;

                        return (
                            <Button
                                key={value}
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "justify-start gap-2",
                                    isActive && "font-medium"
                                )}
                                onClick={() => handleViewChange(value)}
                            >
                                <Icon className="h-4 w-4" />
                                {name}
                            </Button>
                        );
                    })}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
