"use client";

import { motion } from "framer-motion";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";

const DRAG_THRESHOLD = 70;

/**
 * Vertical layer order:
 * year
 * month-expanded
 * month-agenda
 * week
 * agenda
 */
const ORDER = [
  "year",
  "month-expanded",
  "month-agenda",
  "week",
  "agenda",
];

const LAYER_TO_VIEW = {
  year: "year",
  "month-expanded": "month",
  "month-agenda": "month",
  week: "week",
  agenda: "agenda",
};

export function CalendarVerticalSwipeLayer({ children }) {
  const { mobileLayer, setMobileLayer, setView } = useCalendar();

  const handleDragEnd = (_, info) => {
    const offsetY = info.offset.y;
    const offsetX = info.offset.x;

    // ❌ Ignore horizontal intent
    if (Math.abs(offsetY) < Math.abs(offsetX)) return;
    if (Math.abs(offsetY) < DRAG_THRESHOLD) return;

    const currentIndex = ORDER.indexOf(mobileLayer);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    // Swipe UP → deeper view
    if (offsetY < 0) {
      nextIndex = Math.min(currentIndex + 1, ORDER.length - 1);
    }

    // Swipe DOWN → higher view
    if (offsetY > 0) {
      nextIndex = Math.max(currentIndex - 1, 0);
    }

    if (nextIndex === currentIndex) return;

    const nextLayer = ORDER[nextIndex];

    setMobileLayer(nextLayer);
    setView(LAYER_TO_VIEW[nextLayer]);
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.08}
      onDragEnd={handleDragEnd}
      className="flex-1 min-h-0 h-full flex flex-col overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
