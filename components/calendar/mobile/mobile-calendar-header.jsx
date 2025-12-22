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

    const { view, setView, setSelectedDate, events } = useCalendar();
    const ICON_SIZE = "[&_svg]:size-5";
    return (
        <>
            {/* HEADER */}
            <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
                {/* LEFT SIDE */}
                <div className="flex items-center gap-2">
                    {/* Hamburger */}
                    <Button className={ICON_SIZE}
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu />
                    </Button>
                    <motion.div
                        className="flex items-center gap-3"
                        variants={slideFromLeft}
                        initial="initial"
                        animate="animate"
                        transition={transition}>
                        <DateNavigator view={view} events={events} />
                    </motion.div>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center ">
                    {/* Home */}
                    <Button className={ICON_SIZE}
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setView("month");
                            setSelectedDate(new Date());
                            setSearchOpen(false);
                            setSidebarOpen(false);
                        }}
                    >
                        <House />
                    </Button>

                    {/* Search */}
                    <Button className={ICON_SIZE}
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchOpen((prev) => !prev)}
                    >
                        <Search  />
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
                            {tabs.map(({ name, value, icon: Icon }) => {
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
