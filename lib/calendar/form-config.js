// calendar/form-config.js

export const TAG_FORM_CONFIG = {
  Leave: {
    hide: [
      "title",
      "color",
      "doctor",
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
    "doctor",
    "description",
  ],
  show: ["startDate", "endDate", "employees", "hqTerritory"],
  required: ["startDate", "endDate"],
  dateOnly: true,

  fixedColor: "purple",
  details: {
    fields: [
      { key: "owner", label: "Responsible", type: "owner" },
      { key: "startDate", label: "Start Date", type: "date" },
      { key: "endDate", label: "End Date", type: "date" },
      { key: "hqTerritory", label: "HQ Territory", type: "text" },
    ],
  },

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
    show: ["startDate", "doctor"],
    required: ["startDate", "doctor"],
    dateOnly: true,
  
    fixedColor: "yellow",
    details: {
      fields: [
        { key: "owner", label: "Responsible", type: "owner" },
        { key: "startDate", label: "Birthday", type: "date" },
        { key: "doctor", label: "Doctor", type: "text" },
      ],
    },
    autoTitle: ({ doctor }, { doctorOptions }) => {
      if (!doctor) return "Birthday";
    
      // doctor is an ID (e.g. "DR-3135")
      const selectedDoctor = doctorOptions?.find(
        (d) => d.value === doctor
      );
    
      if (!selectedDoctor) return "Birthday";
    
      const doctorName = selectedDoctor.label.replace(/\s+/g, "");
      const doctorCode = selectedDoctor.value;
    
      return `BD-${doctorName}-${doctorCode}`;
    },
    
  },

  "Doctor Visit Plan": {
    hide: [
      "title",
      "endDate",
      "description",
      "color",
    ],
    show: ["startDate", "employees", "doctor"],
    required: ["startDate", "doctor"],
    dateOnly: true,

    fixedColor: "green",

    autoTitle: ({ doctor }) =>
      doctor
        ? `Doctor Visit - ${doctor.label}`
        : "Doctor Visit",

    employee: {
      autoSelectLoggedIn: true,
      multiselect: true,
    },
  },

  "Todo List": {
    hide: [
      "startDate",
      "doctor",
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
