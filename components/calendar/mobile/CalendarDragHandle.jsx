"use client";

import { motion } from "framer-motion";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";

const DRAG_THRESHOLD = 60;

const LAYER_TO_VIEW = {
  "month-expanded": "month",
  "month-agenda": "month",
  "week": "week",
  "agenda": "agenda",
  "year": "year",
};

export function CalendarDragHandle() {
  const { mobileLayer, setMobileLayer, setView } = useCalendar();

  const setLayerAndView = (nextLayer) => {
    if (!nextLayer || nextLayer === mobileLayer) return;

    setMobileLayer(nextLayer);
    setView(LAYER_TO_VIEW[nextLayer]);
  };

  const handleDragEnd = (_, info) => {
    const y = info.offset.y;
    let nextLayer = null;

    // swipe up
    if (y < -DRAG_THRESHOLD) {
      if (mobileLayer === "month-expanded") nextLayer = "month-agenda";
      else if (mobileLayer === "month-agenda") nextLayer = "week";
      else if (mobileLayer === "week") nextLayer = "agenda";
    }

    // swipe down
    if (y > DRAG_THRESHOLD) {
      if (mobileLayer === "agenda") nextLayer = "week";
      else if (mobileLayer === "week") nextLayer = "month-agenda";
      else if (mobileLayer === "month-agenda") nextLayer = "month-expanded";
      else if (mobileLayer === "month-expanded") nextLayer = "year";
    }

    setLayerAndView(nextLayer);
  };

  return (
    <div className="flex justify-center py-1">
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.18}
        onDragEnd={handleDragEnd}
        className="w-[30%] h-3 cursor-pointer rounded-full bg-muted-foreground/40"
      />
    </div>
  );
}
