import { COLORS } from "@/components/calendar/constants";
import { USE_MOCK_DATA } from "@/components/calendar/config";
import { CALENDAR_USERS } from "@/components/auth/calendar-users";

/* =========================================================
   USERS
========================================================= */

/* =========================================================
   TAGS
========================================================= */

export const TAGS = [
  { id: "Event", label: "Event" },
  { id: "Birthday", label: "Birthday" },
  { id: "Meeting", label: "Meeting" },
  { id: "Visit", label: "Visit" },
  { id: "Other", label: "Other" },
];
export const PARTICIPANT_SOURCE_BY_TAG = {
  Event: ["EMPLOYEE"],
  Birthday: ["SALESPARTNER"],
  Meeting: ["EMPLOYEE"],
  Visit: ["EMPLOYEE", "SALESPARTNER"],
  Other: ["EMPLOYEE", "SALESPARTNER"],
};

/* =========================================================
   MOCK GENERATOR
========================================================= */

const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pickRandomUser = () =>
  CALENDAR_USERS[randomBetween(0, CALENDAR_USERS  .length - 1)];

const pickRandomTag = () =>
  TAGS[randomBetween(0, TAGS.length - 1)].id;

const EVENT_TITLES = [
  "Business meeting",
  "Team stand-up",
  "Client presentation",
  "Code review",
  "Sprint planning",
  "Deployment",
];

const mockGenerator = () => {
  if (!USE_MOCK_DATA) return [];

  const result = [];
  let id = 1;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7);

  for (let i = 0; i < 40; i++) {
    const start = new Date(startDate);
    start.setDate(start.getDate() + randomBetween(0, 60));
    start.setHours(randomBetween(9, 18), 0, 0);

    const end = new Date(start);
    end.setMinutes(start.getMinutes() + randomBetween(30, 90));

    result.push({
      id: id++,                  // UI-only
      erpName: null,             // 🚫 mock ≠ ERP
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      title: EVENT_TITLES[randomBetween(0, EVENT_TITLES.length - 1)],
      description: "Mock event",
      color: COLORS[randomBetween(0, COLORS.length - 1)],
      tags: pickRandomTag(),
      user: pickRandomUser(),
      isReadOnly: true,          // 🔒 prevents editing
    });
  }

  return result;
};

export const CALENDAR_ITEMS_MOCK = mockGenerator();
