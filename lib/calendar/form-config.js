// calendar/form-config.js

export const TAG_FORM_CONFIG = {
  Leave: {
    hide: [
      "title",
      "color",
      "doctor",
    ],
    show: ["startDate", "endDate", "description","leaveType"],
    required: ["startDate", "endDate","leaveType"],
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
    details: {
      fields: [
        { key: "owner", label: "Responsible", type: "owner" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "endDate", label: "End Date", type: "date" },
        { key: "leaveType", label: "Leave Type", type: "text" },
        { key: "status", label: "Status", type: "text" },
        { key: "approvedBy", label: "Approved By", type: "text" },
        { key: "description", label: "Description", type: "text" },
        
      ],
    },
  },

 "HQ Tour Plan": {
  hide: [
    "title",
    "color",
    "doctor",
    "description",
  ],
  show: ["startDate", "endDate", "hqTerritory"],
  required: ["startDate", "endDate", "hqTerritory"],
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
  autoTitle: (
    { employees } = {},
    { employeeOptions = [] } = {}
  ) => {
    if (!employees || !employeeOptions.length) return "HQ";
  
    const employeeId = Array.isArray(employees)
      ? employees[0]
      : employees;
  
    const emp = employeeOptions.find(e => e.value === employeeId);
    if (!emp) return "HQ";
  
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
    show: ["title", "startDate", "endDate", "employees","allDay","description"],
    required: ["title", "startDate","endDate", "employees"],
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
        { key: "description", label: "Description", type: "text" },
      ],
    },
    employee: {
      multiselect: true,
      autoSelectLoggedIn: false,
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
    autoTitle: (
      { doctor } = {},
      { doctorOptions } = {}
    ) => {
      if (!doctor) return "Birthday";
    
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
    show: ["startDate", "doctor"],
    required: ["startDate", "doctor","employees"],
    dateOnly: true,

    fixedColor: "green",
    autoTitle: (
      { doctor, employees } = {},
      { doctorOptions = [], employeeOptions = [] } = {}
    ) => {
      if (!doctor || !employees) return "DV";
     
      const empId = Array.isArray(employees) ? employees[0] : employees;
    
      const emp = employeeOptions.find(e => e.value === empId);
      const doc = doctorOptions.find(d => d.value === doctor[0]);
      if (!emp || !doc) return "DV";
    
      const doctorName = doc.label.replace(/\s+/g, "");
      const designation =
        emp.designation?.replace(/\s+/g, "") ?? "Emp";
    
      return `DV-${doctorName}-${designation}`;
    },
    
    forceAllDay: true,     
    employee: {
      autoSelectLoggedIn: true,
      multiselect: false,
    },
    doctor: {
      multiselect: true,
    },
    details: {
      fields: [
        { key: "owner", label: "Responsible", type: "owner" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "doctor", label: "Doctor", type: "text" },
        { key: "employee", label: "Employee", type: "text" },
      ],
    },
  },

  "Todo List": {
    hide: [
      "startDate",
      "doctor",
      "color",
    ],
    show: ["title", "endDate", "employees", "description","priority"],
    required: ["title", "employees"],
    dateOnly: true,
    labels: {
      startDate: "From Date",
      endDate: "To Date",
    },

    fixedColor: "orange",
    employee: {
      multiselect: false,
    },
    todo: {
      assignedToSelfByDefault: true,
      allowMultipleAssignees: true,
    },
    details: {
      fields: [
        { key: "owner", label: "Responsible", type: "owner" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "endDate", label: "End Date", type: "date" },
        { key: "status", label: "Status", type: "text" },
        { key: "priority", label: "Priority", type: "text" },
        { key: "employee", label: "Employee", type: "text" },
        // { key: "description", label: "Description", type: "text" },
      ],
    },
  },
  Other: {
    hide: ["color"],
    show: ["title", "startDate", "endDate", "employees","doctor"],
    required: ["title", "startDate","employees"],
    dateOnly: true,
    fixedColor: "teal",
    details: {
      fields: [
        { key: "owner", label: "Responsible", type: "owner" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "endDate", label: "End Date", type: "date" },
        { key: "description", label: "Description", type: "text" },
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
