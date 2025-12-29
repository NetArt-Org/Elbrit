"use client";

import { useRef } from "react";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { cn } from "@/lib/utils";

const GESTURE_THRESHOLD = 60;

const LAYER_TO_VIEW = {
  "month-expanded": "month",
  "month-agenda": "month",
  week: "week",
  agenda: "agenda",
  year: "year",
};

export function MobileGestureLayerWrapper({ children, className }) {
  const { mobileLayer, setMobileLayer, setView } = useCalendar();

  const deltaRef = useRef(0);
  const lastTouchY = useRef(null);

  const setLayerAndView = (nextLayer) => {
    if (!nextLayer || nextLayer === mobileLayer) return;
    setMobileLayer(nextLayer);
    setView(LAYER_TO_VIEW[nextLayer]);
    deltaRef.current = 0;
  };

  /* -------------------------------
     Mouse / Trackpad
  -------------------------------- */
  const handleWheel = (e) => {
    deltaRef.current += e.deltaY;

    if (deltaRef.current > GESTURE_THRESHOLD) {
      // swipe DOWN
      if (mobileLayer === "month-expanded") setLayerAndView("month-agenda");
      else if (mobileLayer === "month-agenda") setLayerAndView("week");
      else if (mobileLayer === "week") setLayerAndView("agenda");
    }

    if (deltaRef.current < -GESTURE_THRESHOLD) {
      // swipe UP
      if (mobileLayer === "agenda") setLayerAndView("week");
      else if (mobileLayer === "week") setLayerAndView("month-agenda");
      else if (mobileLayer === "month-agenda")
        setLayerAndView("month-expanded");
    }
  };

  /* -------------------------------
     Touch (Mobile)
  -------------------------------- */
  const handleTouchStart = (e) => {
    lastTouchY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (lastTouchY.current == null) return;

    const currentY = e.touches[0].clientY;
    const deltaY = lastTouchY.current - currentY;

    deltaRef.current += deltaY;
    lastTouchY.current = currentY;

    if (deltaRef.current > GESTURE_THRESHOLD) {
      if (mobileLayer === "month-expanded") setLayerAndView("month-agenda");
      else if (mobileLayer === "month-agenda") setLayerAndView("week");
      else if (mobileLayer === "week") setLayerAndView("agenda");
    }

    if (deltaRef.current < -GESTURE_THRESHOLD) {
      if (mobileLayer === "agenda") setLayerAndView("week");
      else if (mobileLayer === "week") setLayerAndView("month-agenda");
      else if (mobileLayer === "month-agenda")
        setLayerAndView("month-expanded");
    }
  };

  const handleTouchEnd = () => {
    deltaRef.current = 0;
    lastTouchY.current = null;
  };

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn("h-full touch-pan-y", className)}
    >
      {children}
    </div>
  );
}
