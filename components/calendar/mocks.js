import { COLORS } from "@/components/calendar/constants";
import { USE_MOCK_DATA } from "@/components/calendar/config";

/* =========================================================
   USERS
========================================================= */

export const USERS_MOCK = [
  { id: "f3b035ac-49f7-4e92-a715-35680bf63175", name: "Michael Doe", picturePath: null },
  { id: "3e36ea6e-78f3-40dd-ab8c-a6c737c3c422", name: "Alice Johnson", picturePath: null },
  { id: "a7aff6bd-a50a-4d6a-ab57-76f76bb27cf5", name: "Robert Smith", picturePath: null },
  { id: "dd503cf9-6c38-43cf-94cc-0d4032e2f77a", name: "Emily Davis", picturePath: null },
];

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

/* =========================================================
   MOCK GENERATOR
========================================================= */

const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pickRandomUser = () =>
  USERS_MOCK[randomBetween(0, USERS_MOCK.length - 1)];

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
