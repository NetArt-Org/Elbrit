// calendar/form-config.js

import { TAG_IDS } from "@/components/calendar/mocks";

export const TAG_FORM_CONFIG = {
  [TAG_IDS.LEAVE]: {
    hide: [
      "title",
      "color",
      "doctor",
    ],
    show: ["startDate", "endDate", "description", "leaveType"],
    required: ["startDate", "endDate", "leaveType"],
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
    ui: {
      lockTagOnEdit: true,
      allowDelete: (event) => event.status !== "APPROVED",
      allowEdit: (event) => event.status !== "APPROVED",
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

  [TAG_IDS.HQ_TOUR_PLAN]: {
    hide: [
      "title",
      "color",
      "doctor",
      "description",
    ],
    show: ["startDate", "endDate", "hqTerritory"],
    required: ["startDate", "hqTerritory"],
    dateOnly: true,
    ui: {
      lockTagOnEdit: true,
      allowDelete: () => false,
      allowEdit: () => true,
    },
    autoTitle: (
      { hqTerritory, employees } = {},
      { employeeOptions = [] } = {}
    ) => {
      if (!hqTerritory || !employees) return null;
  
      const empId = Array.isArray(employees) ? employees[0] : employees;
      const emp = employeeOptions.find(e => e.value === empId);
  
      if (!emp) return null;
  
      return `${hqTerritory}-${emp.label.replace(/\s+/g, "-")}`;
    },
    fixedColor: "purple",
    details: {
      fields: [
        { key: "owner", label: "Responsible", type: "owner" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "endDate", label: "End Date", type: "date" },
        { key: "hqTerritory", label: "HQ Territory", type: "text" },
      ],
    },
    employee: {
      autoSelectLoggedIn: true,
      multiselect: false,
    },
  },

  [TAG_IDS.MEETING]: {
    hide: ["color", "doctor"],
    show: ["title", "startDate", "endDate", "employees", "allDay", "description"],
    required: ["title", "startDate", "endDate", "employees"],
    dateRange: true,

    fixedColor: "blue",
    ui: {
      lockTagOnEdit: true,
      allowDelete: () => true,
      allowEdit: () => true,
    },
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

  [TAG_IDS.BIRTHDAY]: {
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
    ui: {
      lockTagOnEdit: true,
      allowDelete: () => false,
      allowEdit: () => true,
    },
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

  [TAG_IDS.DOCTOR_VISIT_PLAN]: {
    hide: [
      "title",
      "endDate",
      "description",
      "color",
    ],
    show: ["startDate", "doctor"],
    required: ["startDate", "doctor"],
    dateOnly: true,
    labels: {
      startDate: "Date",
    },
    ui: {
      lockTagOnEdit: true,
      allowDelete: () => false,
      allowEdit: () => true,
    },
    fixedColor: "green",
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

  [TAG_IDS.TODO_LIST]: {
    hide: [
      "startDate",
      "doctor",
      "color", "title"
    ],
    show: ["endDate", "employees", "description", "priority"],
    required: ["employees"],
    dateOnly: true,
    labels: {
      startDate: "From Date",
      endDate: "To Date",
    },
    ui: {
      lockTagOnEdit: true,
      allowDelete: () => true,
      allowEdit: () => true,
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
    show: ["title", "startDate", "endDate", "employees", "doctor"],
    required: ["title", "startDate", "employees"],
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
    ui: {
      lockTagOnEdit: true,
      allowDelete: () => true,
      allowEdit: () => true,
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
    ui: {
      lockTagOnEdit: false,
      allowEdit: () => true,
      allowDelete: () => true,
    },
    required: ["title", "startDate"],

    fixedColor: "blue",
  },
};
