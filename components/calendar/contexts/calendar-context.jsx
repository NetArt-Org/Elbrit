"use client";;
import { createContext, useContext, useState,useEffect,useRef } from "react";
import { useLocalStorage } from "@/components/calendar/hooks";
import { CALENDAR_USERS } from "@/components/auth/calendar-users";
import { fetchEventsByRange } from "@/services/event.service";
import { resolveCalendarRange } from "@/lib/calendar/range";
import { EMPLOYEES_QUERY } from "@/services/events.query";
import { mapEmployeesToCalendarUsers } from "@/lib/employee-to-calendar-user";
import { graphqlRequest } from "@/lib/graphql-client";


const DEFAULT_SETTINGS = {
	badgeVariant: "colored",
	view: "day",
	use24HourFormat: true,
	agendaModeGroupBy: "date",
};

const CalendarContext = createContext({});

export function CalendarProvider({
	children,
	events,
	badge = "colored",
	view = "day"
}) {
	console.log("CalendarProvider RENDERED");
	const [settings, setSettings] = useLocalStorage("calendar-settings", {
		...DEFAULT_SETTINGS,
		badgeVariant: badge,
		view: view,
	});
	const [mobileMode, setMobileMode] = useState("expanded");
	const [badgeVariant, setBadgeVariantState] = useState(settings.badgeVariant);
	const [currentView, setCurrentViewState] = useState(settings.view);
	const [use24HourFormat, setUse24HourFormatState] = useState(settings.use24HourFormat);
	const [agendaModeGroupBy, setAgendaModeGroupByState] = useState(settings.agendaModeGroupBy);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedUserId, setSelectedUserId] = useState("all");
	const [selectedColors, setSelectedColors] = useState([]);
	const [allEvents, setAllEvents] = useState(events || []);
	const [filteredEvents, setFilteredEvents] = useState(events || []);
	const [users, setUsers] = useState([]);
	const [usersLoading, setUsersLoading] = useState(true);

	const [eventListDate, setEventListDate] = useState(null);
	const [activeDate, setActiveDate] = useState(null);
	const isEventListOpen = eventListDate !== null;
	const [mobileLayer, setMobileLayer] = useState("month-expanded");
	const updateSettings = (newPartialSettings) => {
		setSettings({
			...settings,
			...newPartialSettings,
		});
	};

	const setBadgeVariant = (variant) => {
		setBadgeVariantState(variant);
		updateSettings({ badgeVariant: variant });
	};

	const setView = (newView) => {
		setCurrentViewState(newView);
		updateSettings({ view: newView });
	};

	const toggleTimeFormat = () => {
		const newValue = !use24HourFormat;
		setUse24HourFormatState(newValue);
		updateSettings({ use24HourFormat: newValue });
	};

	const setAgendaModeGroupBy = (groupBy) => {
		setAgendaModeGroupByState(groupBy);
		updateSettings({ agendaModeGroupBy: groupBy });
	};

	const filterEventsBySelectedColors = (color) => {
		const isColorSelected = selectedColors.includes(color);
		const newColors = isColorSelected
			? selectedColors.filter((c) => c !== color)
			: [...selectedColors, color];

		if (newColors.length > 0) {
			const filtered = allEvents.filter((event) => {
				const eventColor = event.color || "blue";
				return newColors.includes(eventColor);
			});
			setFilteredEvents(filtered);
		} else {
			setFilteredEvents(allEvents);
		}

		setSelectedColors(newColors);
	};

	const filterEventsBySelectedUser = (userId) => {
		setSelectedUserId(userId);
		if (userId === "all") {
			setFilteredEvents(allEvents);
		} else {
			const filtered = allEvents.filter((event) => event.owner?.id === userId);
			setFilteredEvents(filtered);
		}
	};

	const handleSelectDate = (date) => {
		if (!date) return;
		setSelectedDate(date);
	};

	const addEvent = (event) => {
		const normalized = {
		  ...event,
		  startDate: new Date(event.startDate).toISOString(),
		  endDate: new Date(event.endDate).toISOString(),
		};
	  
		setAllEvents((prev) => [...prev, normalized]);
		setFilteredEvents((prev) => [...prev, normalized]);
	  };
	  
	  const updateEvent = (updatedEvent) => {
		if (!updatedEvent.erpName) {
		  console.warn("Attempted to update event without erpName", updatedEvent);
		  return;
		}
	  
		const normalized = {
		  ...updatedEvent,
		  startDate: new Date(updatedEvent.startDate).toISOString(),
		  endDate: new Date(updatedEvent.endDate).toISOString(),
		};
	  
		setAllEvents((prev) =>
		  prev.map((e) =>
			e.erpName === normalized.erpName ? normalized : e
		  )
		);
	  
		setFilteredEvents((prev) =>
		  prev.map((e) =>
			e.erpName === normalized.erpName ? normalized : e
		  )
		);
	  };
	  

	  const removeEvent = (erpName) => {
		if (!erpName) return;
	  
		setAllEvents(prev => prev.filter(e => e.erpName !== erpName));
		setFilteredEvents(prev => prev.filter(e => e.erpName !== erpName));
	  };
	  
	  
	const clearFilter = () => {
		setFilteredEvents(allEvents);
		setSelectedColors([]);
		setSelectedUserId("all");
	};
	useEffect(() => {
		let cancelled = false;
	  
		async function hydrateFromGraphql() {
		  const { start, end } = resolveCalendarRange(currentView, selectedDate);
	  
		  try {
			const events = await fetchEventsByRange(
			  start,
			  end,
			  currentView
			);
	  
			if (!cancelled) {
			  setAllEvents(events);
			  setFilteredEvents(events);
			}
		  } catch (err) {
			console.error("Failed to fetch events", err);
		  }
		}
	  
		hydrateFromGraphql();
	  
		return () => {
		  cancelled = true;
		};
	  }, [currentView, selectedDate]);
	  
	  useEffect(() => {
		let cancelled = false;
	  
		console.log("Employee effect START");
	  
		async function hydrateEmployees() {
		  try {
			const data = await graphqlRequest(EMPLOYEES_QUERY, {
			  first: 50,
			});
	  
			const employees =
			  data?.Employees?.edges?.map(e => e.node) ?? [];
	  
			const mappedUsers = mapEmployeesToCalendarUsers(employees);
	  
			if (!cancelled) {
			  setUsers(mappedUsers);
			  setUsersLoading(false);
			}
	  
			console.log("Employee data", employees, mappedUsers);
		  } catch (err) {
			console.error("Failed to fetch employees", err);
			setUsersLoading(false);
		  }
		}
	  
		hydrateEmployees();
		return () => {
		  cancelled = true;
		};
	  }, []);
	  
	  
	const value = {
		selectedDate,
		setSelectedDate: handleSelectDate,
		selectedUserId,
		setSelectedUserId,
		badgeVariant,
		setBadgeVariant,
		users,
		usersLoading,
		selectedColors,
		filterEventsBySelectedColors,
		filterEventsBySelectedUser,
		events: filteredEvents,
		view: currentView,
		use24HourFormat,
		toggleTimeFormat,
		setView,
		agendaModeGroupBy,
		setAgendaModeGroupBy,
		addEvent,
		updateEvent,
		removeEvent,
		clearFilter,
		mobileMode,
		setMobileMode,
		eventListDate,
		setEventListDate,
		isEventListOpen,
		activeDate, setActiveDate, mobileLayer,
		setMobileLayer,
	};

	return (
		<CalendarContext.Provider value={value}>
			{children}
		</CalendarContext.Provider>
	);
}

export function useCalendar() {
	const context = useContext(CalendarContext);
	if (!context)
		throw new Error("useCalendar must be used within a CalendarProvider.");
	return context;
}
