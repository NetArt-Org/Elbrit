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

  autoTitle: ({ employees }, { employeeOptions }) => {
    if (!employees || !employeeOptions?.length) return "HQ";
  
    // employees is an ID or array (autoSelectLoggedIn)
    const employeeId = Array.isArray(employees)
      ? employees[0]
      : employees;
  
    const emp = employeeOptions.find(e => e.value === employeeId);
    if (!emp) return `HQ-${employeeId}`;
  
    const designation = emp.designation
      ? emp.designation.replace(/\s+/g, "")
      : "Emp";
  
    return `HQ-${designation}-${employeeId}`;
  },
  

  employee: {
    autoSelectLoggedIn: true,
    multiselect: false,
  },
},


  Meeting: {
    hide: ["color","doctor"],
    show: ["title", "startDate", "endDate", "employees"],
    required: ["title", "startDate", "employees"],
    dateRange: true,

    fixedColor: "blue",

    time: {
      defaultDurationMinutes: 60,
      allowAllDay: true,
    },
    details: {
      fields: [
        { key: "owner", label: "Responsible", type: "owner" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "endDate", label: "End Date", type: "date" },
        { key: "employee", label: "Employee", type: "text" },
      ],
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
    forceAllDay: true,
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
    required: ["startDate", "doctor","employees"],
    dateOnly: true,

    fixedColor: "green",

    autoTitle: ({ doctor, employees }, { doctorOptions, employeeOptions }) => {
      if (!doctor || !employees) return "DV";
    
      const empId = Array.isArray(employees) ? employees[0] : employees;
      const emp = employeeOptions?.find(e => e.value === empId);
      const doc = doctorOptions?.find(d => d.value === doctor);
    
      if (!emp || !doc) return "DV";
    
      const doctorName = doc.label.replace(/\s+/g, "");
      const designation = emp.designation?.replace(/\s+/g, "") ?? "Emp";
    
      return `DV-${doctorName}-${designation}`;
    },
    forceAllDay: true,     
    employee: {
      autoSelectLoggedIn: true,
      multiselect: true,
    },
    doctor: {
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
    employee: {
      multiselect: true,
    },
    todo: {
      assignedToSelfByDefault: true,
      allowMultipleAssignees: true,
    },
  },
  Other: {
    hide: ["color"],
    show: ["title", "startDate", "endDate", "employees","doctor"],
    required: ["title", "startDate"],
    dateOnly: true,
    fixedColor: "teal",
    details: {
      fields: [
        { key: "owner", label: "Responsible", type: "owner" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "description", label: "Description", type: "date" },
      ],
    },
    employee: {
      multiselect: true,
    },
    doctor: {
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
