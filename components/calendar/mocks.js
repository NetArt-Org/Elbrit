import { COLORS } from "@/components/calendar/constants";

/* =========================================================
   USERS
========================================================= */

export const USERS_MOCK = [
  {
    id: "f3b035ac-49f7-4e92-a715-35680bf63175",
    name: "Michael Doe",
    picturePath: null,
  },
  {
    id: "3e36ea6e-78f3-40dd-ab8c-a6c737c3c422",
    name: "Alice Johnson",
    picturePath: null,
  },
  {
    id: "a7aff6bd-a50a-4d6a-ab57-76f76bb27cf5",
    name: "Robert Smith",
    picturePath: null,
  },
  {
    id: "dd503cf9-6c38-43cf-94cc-0d4032e2f77a",
    name: "Emily Davis",
    picturePath: null,
  },
];

/* =========================================================
   TAGS (System + Custom)
========================================================= */

export const TAGS = [
  { id: "birthday", label: "Birthday"},
  { id: "ooo", label: "Out of office"},
  { id: "work_location", label: "Working location",},
  { id: "task", label: "Task"},
  { id: "event", label: "Event"},

  // Custom tags
  { id: "travel", label: "Travel", },
  { id: "health", label: "Health", },
  { id: "personal", label: "Personal",  },
  { id: "important", label: "Important",  },
];

/* =========================================================
   HOLIDAYS (Non-editable)
========================================================= */

const HOLIDAYS = [
  { title: "Christmas", month: 11, day: 25 },
  { title: "New Year’s Eve", month: 11, day: 31 },
  { title: "Makar Sankranti", month: 0, day: 14 },
];

/* =========================================================
   EVENT TITLES
========================================================= */

const EVENT_TITLES = [
  "Business meeting",
  "Team stand-up",
  "Client presentation",
  "Code review",
  "QA testing",
  "Sprint planning",
  "Deployment",
  "Design review",
  "One-on-one",
  "Workshop",
  "Conference call",
  "Project deadline",
];

/* =========================================================
   UTILS
========================================================= */

const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pickRandomUser = () =>
  USERS_MOCK[randomBetween(0, USERS_MOCK.length - 1)];

const pickRandomTags = () => {
  const count = randomBetween(0, 3);
  return [...TAGS]
    .sort(() => 0.5 - Math.random())
    .slice(0, count)
    .map((t) => t.id);
};

/* =========================================================
   DAY DENSITY PROFILES
========================================================= */

const DAY_TYPES = [
  { type: "empty", weight: 45, min: 0, max: 0 },
  { type: "light", weight: 25, min: 1, max: 2 },
  { type: "medium", weight: 15, min: 5, max: 8 },
  { type: "heavy", weight: 10, min: 15, max: 20 },
  { type: "extreme", weight: 5, min: 30, max: 40 },
];

const pickDayType = () => {
  const roll = Math.random() * 100;
  let acc = 0;

  for (const type of DAY_TYPES) {
    acc += type.weight;
    if (roll <= acc) return type;
  }
  return DAY_TYPES[0];
};

/* =========================================================
   MOCK GENERATOR
========================================================= */

const mockGenerator = () => {
  const result = [];
  let id = 1;

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + 7);

  const monthsToGenerate = 3;

  /* -------------------------
     Normal events
  ------------------------- */
  for (let m = 0; m < monthsToGenerate; m++) {
    const monthStart = new Date(startDate);
    monthStart.setMonth(startDate.getMonth() + m);
    monthStart.setDate(1);

    const daysInMonth = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0
    ).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dayType = pickDayType();
      if (dayType.min === 0) continue;

      const eventCount = randomBetween(dayType.min, dayType.max);

      for (let e = 0; e < eventCount; e++) {
        const startHour = randomBetween(8, 18);
        const start = new Date(
          monthStart.getFullYear(),
          monthStart.getMonth(),
          d,
          startHour,
          randomBetween(0, 1) * 30
        );

        const end = new Date(start);
        end.setMinutes(start.getMinutes() + randomBetween(30, 120));

        result.push({
          id: id++,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          title: EVENT_TITLES[randomBetween(0, EVENT_TITLES.length - 1)],
          description: `${dayType.type.toUpperCase()} load event`,
          color: COLORS[randomBetween(0, COLORS.length - 1)],
          user: pickRandomUser(),

          // ✅ New
          tags: pickRandomTags(),
        });
      }
    }
  }

  /* -------------------------
     Long-range reminder
  ------------------------- */
  const reminderDate = new Date(startDate);
  reminderDate.setMonth(reminderDate.getMonth() + 2);

  result.push({
    id: id++,
    startDate: reminderDate.toISOString(),
    endDate: reminderDate.toISOString(),
    title: "Quarterly Planning Reminder",
    description: "Long-range reminder",
    color: "blue",
    user: USERS_MOCK[0],

    tags: ["task", "important"],
  });

  /* -------------------------
     Birthday example
  ------------------------- */
  const birthday = new Date(startDate);
  birthday.setDate(startDate.getDate() + 10);

  result.push({
    id: id++,
    startDate: birthday.toISOString(),
    endDate: birthday.toISOString(),
    title: "Alice Johnson Birthday",
    description: "Birthday",
    color: "pink",
    user: USERS_MOCK[1],

    tags: ["birthday"],
    isAllDay: true,
  });

  return result;
};

/* =========================================================
   EXPORT
========================================================= */

export const CALENDAR_ITEMS_MOCK = mockGenerator();
