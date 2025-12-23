import { AnimatePresence, motion } from "framer-motion";
import { useMemo,startTransition } from "react";
import {
	staggerContainer,
	SwipeFadeVariants,
	transition,
} from "@/components/calendar/animations";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { cn } from "@/lib/utils";
import {
	calculateMonthEventPositions,
	getCalendarCells, navigateDate,
} from "@/components/calendar/helpers";
import { DayCell } from "@/components/calendar/views/month-view/day-cell";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SWIPE_THRESHOLD = 80;

export function CalendarMonthView({
	singleDayEvents, view,
	multiDayEvents
}) {
	const { selectedDate, setSelectedDate, isEventListOpen } = useCalendar();
	const allEvents = [...multiDayEvents, ...singleDayEvents];

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

	return (
		<motion.div initial="initial" animate="animate" variants={staggerContainer} className={cn("w-full transition-all duration-300", isEventListOpen ? "h-[60vh]" : "h-[90vh]")}>
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
					key={selectedDate.toISOString()}
					variants={SwipeFadeVariants}
					initial="initial"
					animate="animate"
					exit="exit"
					transition={{ duration: 0.12, ease: "easeOut" }} // 🔥 faster
					drag="x"
					dragConstraints={{ left: 0, right: 0 }}
					dragElastic={0.12}
					onDragEnd={handleDragEnd}
					className="grid grid-cols-7 grid-rows-6 h-full"
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
	);
}
