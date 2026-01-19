// calendar/form-config.js

export const TAG_FORM_CONFIG = {
  Leave: {
    hide: [
      "title",
      "color",
      "salesPartner",
    ],
    show: ["startDate", "endDate", "description"],
    required: ["startDate", "endDate"],
    dateOnly: true,

    fixedColor: "red",

    autoTitle: () => "Leave",

    employee: {
      autoSelectLoggedIn: true,
      multiselect: false,
    },

    leave: {
      approvalRequired: true,
      medicalCertificateAfterDays: 2,
    },
  },

 "HQ Tour Plan": {
  hide: [
    "title",
    "color",
    "salesPartner",
    "description",
  ],
  show: ["startDate", "endDate", "employees", "hqTerritory"],
  required: ["startDate", "endDate"],
  dateOnly: true,

  fixedColor: "purple",

  autoTitle: ({ employees, startDate }) => {
    // employees is ALWAYS present (auto-selected)
    const employeeId = Array.isArray(employees)
      ? employees[0]
      : employees;

    if (!employeeId || !startDate) return "HQ";

    const d = new Date(startDate);
    const yyyyMMdd = `${d.getFullYear()}${String(
      d.getMonth() + 1
    ).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

    return `HQ-${employeeId}-${yyyyMMdd}`;
  },

  employee: {
    autoSelectLoggedIn: true,
    multiselect: false,
  },
},


  Meeting: {
    hide: ["color"],
    show: ["title", "startDate", "endDate", "employees"],
    required: ["title", "startDate", "endDate"],
    dateRange: true,

    fixedColor: "blue",

    time: {
      defaultDurationMinutes: 60,
      allowAllDay: true,
    },

    employee: {
      multiselect: true,
    },
  },

  Birthday: {
    hide: [
      "title",
      "endDate",
      "description",
      "employees",
      "color",
    ],
    show: ["startDate", "salesPartner"],
    required: ["startDate", "salesPartner"],
    dateOnly: true,

    fixedColor: "yellow",

    autoTitle: ({ salesPartner }) =>
      salesPartner ? `${salesPartner.label} Birthday` : "Birthday",
  },

  "Doctor Visit Plan": {
    hide: [
      "title",
      "endDate",
      "description",
      "color",
    ],
    show: ["startDate", "employees", "salesPartner"],
    required: ["startDate", "salesPartner"],
    dateOnly: true,

    fixedColor: "green",

    autoTitle: ({ salesPartner }) =>
      salesPartner
        ? `Doctor Visit - ${salesPartner.label}`
        : "Doctor Visit",

    employee: {
      autoSelectLoggedIn: true,
      multiselect: true,
    },
  },

  "Todo List": {
    hide: [
      "startDate",
      "salesPartner",
      "color",
    ],
    show: ["title", "endDate", "employees", "description"],
    required: ["title", "endDate"],
    dateOnly: true,

    fixedColor: "orange",

    todo: {
      assignedToSelfByDefault: true,
      allowMultipleAssignees: true,
    },
  },

  Other: {
    hide: ["color"],
    show: ["title", "startDate", "endDate", "employees", "description"],
    required: ["title", "startDate"],
    dateRange: true,

    fixedColor: "teal",

    employee: {
      multiselect: true,
    },
  },

  DEFAULT: {
    hide: ["color"],
    show: [
      "title",
      "startDate",
      "endDate",
      "description",
      "employees",
    ],
    required: ["title", "startDate"],

    fixedColor: "blue",
  },
};
