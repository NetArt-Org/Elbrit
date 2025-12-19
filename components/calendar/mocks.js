import { COLORS } from "@/components/calendar/constants";

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

const HOLIDAYS = [
	{
	  title: "Christmas",
	  month: 11, // December (0-based)
	  day: 25,
	},
	{
	  title: "New Year’s Eve",
	  month: 11,
	  day: 31,
	},
	{
	  title: "Makar Sankranti",
	  month: 0, // January
	  day: 14,
	},
  ];
  
// ================================== //

const events = [
	"Doctor's appointment",
	"Dental cleaning",
	"Eye exam",
	"Therapy session",
	"Business meeting",
	"Team stand-up",
	"Project deadline",
	"Weekly report submission",
	"Client presentation",
	"Marketing strategy review",
	"Networking event",
	"Sales call",
	"Investor pitch",
	"Board meeting",
	"Employee training",
	"Performance review",
	"One-on-one meeting",
	"Lunch with a colleague",
	"HR interview",
	"Conference call",
	"Web development sprint planning",
	"Software deployment",
	"Code review",
	"QA testing session",
	"Cybersecurity audit",
	"Server maintenance",
	"API integration update",
	"Data backup",
	"Cloud migration",
	"System upgrade",
	"Content planning session",
	"Product launch",
	"Customer support review",
	"Team building activity",
	"Legal consultation",
	"Budget review",
	"Financial planning session",
	"Tax filing deadline",
	"Investor relations update",
	"Partnership negotiation",
	"Medical check-up",
	"Vaccination appointment",
	"Blood donation",
	"Gym workout",
	"Yoga class",
	"Physical therapy session",
	"Nutrition consultation",
	"Personal trainer session",
	"Parent-teacher meeting",
	"School open house",
	"College application deadline",
	"Final exam",
	"Graduation ceremony",
	"Job interview",
	"Internship orientation",
	"Office relocation",
	"Business trip",
	"Flight departure",
	"Hotel check-in",
	"Vacation planning",
	"Birthday party",
	"Wedding anniversary",
	"Family reunion",
	"Housewarming party",
	"Community volunteer work",
	"Charity fundraiser",
	"Religious service",
	"Concert attendance",
	"Theater play",
	"Movie night",
	"Sporting event",
	"Football match",
	"Basketball game",
	"Tennis practice",
	"Marathon training",
	"Cycling event",
	"Fishing trip",
	"Camping weekend",
	"Hiking expedition",
	"Photography session",
	"Art workshop",
	"Cooking class",
	"Book club meeting",
	"Grocery shopping",
	"Car maintenance",
	"Home renovation meeting",
];

const randomBetween = (min, max) =>
	Math.floor(Math.random() * (max - min + 1)) + min;
  
  const shouldHaveEvents = () => Math.random() < 0.4;
  // 40% days have events, 60% are empty → lots of free days

  
  const mockGenerator = () => {
	const result = [];
	let currentId = 1;
  
	const now = new Date();
	const startDate = new Date(now);
	startDate.setDate(now.getDate() + 7);
  
	const monthsToGenerate = 3;
  
	// ---- 1. Add holidays explicitly ----
	// for (let i = 0; i < monthsToGenerate; i++) {
	//   const year = startDate.getFullYear();
	//   const month = startDate.getMonth() + i;
  
	//   HOLIDAYS.forEach(holiday => {
	// 	if (holiday.month === month % 12) {
	// 	  const date = new Date(year, month, holiday.day);
	// 	  const SYSTEM_USER = {
	// 		id: "system",
	// 		name: "System",
	// 		picturePath: null,
	// 	  };
		  
	// 	  result.push({
	// 		id: currentId++,
	// 		startDate: new Date(date.setHours(0, 0)).toISOString(),
	// 		endDate: new Date(date.setHours(23, 59)).toISOString(),
	// 		title: holiday.title,
	// 		color: "red",
	// 		description: "Public holiday",
	// 		user: SYSTEM_USER,
	// 	  });
	// 	}
	//   });
	// }
  
	// ---- 2. Generate normal events day-by-day ----
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
		if (!shouldHaveEvents()) continue; // ✅ free day
  
		const eventCount = randomBetween(1, 2); // max 2 events/day
  
		for (let e = 0; e < eventCount; e++) {
		  const start = new Date(
			monthStart.getFullYear(),
			monthStart.getMonth(),
			d,
			randomBetween(9, 17),
			0
		  );
  
		  const end = new Date(start);
		  end.setHours(start.getHours() + randomBetween(1, 2));
  
		  result.push({
			id: currentId++,
			startDate: start.toISOString(),
			endDate: end.toISOString(),
			title: events[randomBetween(0, events.length - 1)],
			color: COLORS[randomBetween(0, COLORS.length - 1)],
			description: "Auto-generated mock event",
			user: USERS_MOCK[randomBetween(0, USERS_MOCK.length - 1)],
		  });
		}
	  }
	}
  
	// ---- 3. Long-range reminders (2–3 months ahead) ----
	const reminderDate = new Date(startDate);
	reminderDate.setMonth(reminderDate.getMonth() + 2);
  
	result.push({
	  id: currentId++,
	  startDate: reminderDate.toISOString(),
	  endDate: reminderDate.toISOString(),
	  title: "Quarterly Planning Reminder",
	  color: "blue",
	  description: "Long-range reminder event",
	  user: USERS_MOCK[0],
	});
  
	return result;
  };
  

export const CALENDAR_ITEMS_MOCK = mockGenerator(80);
