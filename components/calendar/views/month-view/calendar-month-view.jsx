import { AnimatePresence, motion } from "framer-motion";
import { useMemo, startTransition } from "react";
import {
	staggerContainer,
	SwipeFadeVariants,
	transition,
} from "@/components/calendar/animations";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { cn } from "@/lib/utils";
import {
	calculateMonthEventPositions,
	getCalendarCells, getMonthCellEvents, navigateDate,
} from "@/components/calendar/helpers";
import { DayCell } from "@/components/calendar/views/month-view/day-cell";
import { EventListDialog } from "../../dialogs/events-list-dialog";
import { useMediaQuery } from "@/components/calendar/hooks";
import { AgendaEvents } from "@/components/calendar/views/agenda-view/agenda-events";
import { useState } from "react";

const SWIPE_Y_THRESHOLD = 70;

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SWIPE_THRESHOLD = 80;

export function CalendarMonthView({
	singleDayEvents, view,
	multiDayEvents
}) {
	const { selectedDate, setSelectedDate, isEventListOpen, eventListDate, setEventListDate } = useCalendar();
	const allEvents = [...multiDayEvents, ...singleDayEvents];
	const isMobile = useMediaQuery("(max-width: 768px)");
	const [isCollapsed, setIsCollapsed] = useState(false);

	const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);

	const eventPositions = useMemo(() =>
		calculateMonthEventPositions(multiDayEvents, singleDayEvents, selectedDate), [multiDayEvents, singleDayEvents, selectedDate]);
	/* ================================
		 Swipe handler
		 Left  → Previous month
		 Right → Next month
	  ================================ */
	const handleDragEnd = (_, info) => {
		const offsetX = info.offset.x;

		if (offsetX < -SWIPE_THRESHOLD) {
			startTransition(() => {
				setSelectedDate(navigateDate(selectedDate, "month", "next"));
			});
		}

		if (offsetX > SWIPE_THRESHOLD) {
			startTransition(() => {
				setSelectedDate(navigateDate(selectedDate, "month", "previous"));
			});
		}
	};
	const handleVerticalDragEnd = (_, info) => {
		const offsetY = info.offset.y;

		// swipe up → collapse
		if (offsetY < -SWIPE_Y_THRESHOLD) {
			setIsCollapsed(true);
		}

		// swipe down → expand
		if (offsetY > SWIPE_Y_THRESHOLD) {
			setIsCollapsed(false);
		}
	};

	return (
		<motion.div
			variants={staggerContainer}
			initial={false}
			transition={{ duration: 0.3, ease: "easeInOut" }}

			drag={isMobile ? "y" : false}
			dragConstraints={isMobile ? { top: 0, bottom: 0 } : undefined}
			dragElastic={isMobile ? 0.1 : 0}
			onDragEnd={isMobile ? handleVerticalDragEnd : undefined}

			animate={{ y: 0 }}
			className="flex-1 min-h-0 h-full flex flex-col overflow-hidden"
		>
			<motion.div className="overflow-hidden" animate={{ height: isCollapsed ? "35%" : "100%", }}>
				<div className="grid grid-cols-7">
					{WEEK_DAYS.map((day, index) => (
						<motion.div
							key={day}
							className="flex items-center justify-center py-2"
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05, ...transition }}>
							<span className="text-xs font-medium text-t-quaternary">{day}</span>
						</motion.div>
					))}
				</div>
				{/* Swipeable month grid */}
				<AnimatePresence initial={false}>
					<motion.div
						// key={monthKey}
						variants={SwipeFadeVariants}
						initial="initial"
						// animate="animate"
						exit="exit"
						transition={{ duration: 0.12, ease: "easeOut" }} // 🔥 faster
						drag="x"
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.12}
						onDragEnd={handleDragEnd}
						className="grid grid-cols-7 grid-rows-6 h-full min-h-0"
					>
						{cells.map((cell, index) => (
							<DayCell
								key={index}
								cell={cell}
								events={allEvents}
								eventPositions={eventPositions}
							/>
						))}
					</motion.div>
				</AnimatePresence>
			</motion.div>
			{!isMobile && <EventListDialog />}

			{isMobile && isCollapsed && (
				<div className="overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-t">
					<AgendaEvents scope="month" scrollToSelectedDate />
				</div>
			)}

		</motion.div>
	);
}
