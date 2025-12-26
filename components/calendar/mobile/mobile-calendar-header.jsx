"use client";

import { useState } from "react";
import {
    Menu,
    Search,
    CheckSquare,
    House,
    Rows2,
    CalendarRange,
    List,
    Columns,
    Grid3X3,
    Grid2X2,
} from "lucide-react";
import { motion } from "framer-motion";
import { slideFromLeft, transition, } from "@/components/calendar/animations";
import { Button } from "@/components/ui/button";
import { format, isSameDay } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CalendarSidebar } from "./calendar-sidebar";
import { AgendaEvents } from "@/components/calendar/views/agenda-view/agenda-events";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { cn } from "@/lib/utils";
import { tabs } from "@/components/calendar/header/view-tabs";
import { DateNavigator } from "@/components/calendar/header/date-navigator";

export function MobileCalendarHeader() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    const { view, setView, setSelectedDate, events, selectedDate } = useCalendar();
    const ICON_SIZE = "[&_svg]:size-5";
    const today = new Date();
    const todayDate = format(today, "d");
    return (
        <>
            {/* HEADER */}
            <header className="flex items-center justify-between border-b px-0 py-2 md:hidden">
                {/* LEFT SIDE */}
                <div className="flex items-center gap-1">
                    {/* Hamburger */}
                    <Button className={ICON_SIZE}
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu />
                    </Button>
                    <motion.div
                        className="flex items-center gap-2"
                        variants={slideFromLeft}
                        initial="initial"
                        animate="animate"
                        transition={transition}>
                        <DateNavigator view={view} events={events} />
                    </motion.div>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center ">
                    {/* Today date (Google Calendar style) */}
                    <Button
                        onClick={() => {
                            setSelectedDate(new Date());
                            setSearchOpen(false);
                            setSidebarOpen(false);
                        }}
                        className=" mx-1 px-2 h-8 flex items-center justify-center text-sm font-medium border border-black border-solid  hover:text-foreground hover:bg-muted/40 rounded-sm transition-colors "
                        aria-label="Go to today" variant="ghost">
                        {todayDate}
                    </Button>
                    {/* View switch dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={ICON_SIZE}>
                                <Rows2 />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className="w-44"
                        >
                            {tabs.filter((tab) => tab.value !== "day").map(({ name, value, icon: Icon }) => {
                                const isActive = view === value;

                                return (
                                    <DropdownMenuItem
                                        key={value}
                                        onClick={() => setView(value)}
                                        className={cn(
                                            "flex items-center gap-2 cursor-pointer",
                                            isActive && "bg-muted font-medium"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {name}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Tasks */}
                    <Button variant="ghost" size="icon" className={ICON_SIZE}>
                        <CheckSquare />
                    </Button>
                    {/* Home */}
                    <Button className={ICON_SIZE}
                        variant="ghost"
                        size="icon">
                        <House />
                    </Button>
                </div>
            </header>

            {/* INLINE SEARCH PANEL */}
            {searchOpen && (
                <div className="md:hidden border-b bg-background">
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
