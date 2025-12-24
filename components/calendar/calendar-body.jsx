"use client";

import { isSameDay, parseISO } from "date-fns";
import { motion } from "framer-motion";
import React from "react";
import { fadeIn, transition } from "@/components/calendar/animations";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { AgendaEvents } from "@/components/calendar/views/agenda-view/agenda-events";
import { CalendarMonthView } from "@/components/calendar/views/month-view/calendar-month-view";
import { CalendarDayView } from "@/components/calendar/views/week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "@/components/calendar/views/week-and-day-view/calendar-week-view";
import { CalendarYearView } from "@/components/calendar/views/year-view/calendar-year-view";
import MobileAddEventBar from "./mobile/MobileAddEventBar";
import { useMediaQuery } from "./hooks";
export function CalendarBody() {
	const { view, events } = useCalendar();
	const isMobile = useMediaQuery("(max-width: 768px)");
	const singleDayEvents = events.filter((event) => {
		const startDate = parseISO(event.startDate);
		const endDate = parseISO(event.endDate);
		return isSameDay(startDate, endDate);
	});

	const multiDayEvents = events.filter((event) => {
		const startDate = parseISO(event.startDate);
		const endDate = parseISO(event.endDate);
		return !isSameDay(startDate, endDate);
	});

	return (
		<div className="w-full h-[79vh] md:h-full md:pb-[80px] overflow-scroll relative">
			<motion.div className="h-full overflow-hidden"
				key={view}
				initial="initial"
				animate="animate"
				exit="exit"
				variants={fadeIn}
				transition={transition}>
				{view === "month" && (
					<CalendarMonthView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
				)}
				{view === "week" && (
					isMobile ? (
						<AgendaEvents scope="week" />
					) : (
						<CalendarWeekView
							singleDayEvents={singleDayEvents}
							multiDayEvents={multiDayEvents}
						/>
					)
				)}

				{view === "day" && (
					<CalendarDayView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
				)}
				{view === "year" && (
					<CalendarYearView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
				)}
				{view === "agenda" && (
					<motion.div
						key="agenda"
						initial="initial"
						animate="animate"
						exit="exit"
						variants={fadeIn}
						transition={transition}>
						<AgendaEvents />
					</motion.div>
				)}
				<MobileAddEventBar />
			</motion.div>
		</div>
	);
}
