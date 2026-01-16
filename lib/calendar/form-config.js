// calendar/form-config.js
export const TAG_FORM_CONFIG = {
    "Birthday": {
      show: ["title", "startDate", "salesPartner"],
      hide: ["endDate", "description", "employees"],
      required: ["title", "startDate", "salesPartner"],
      dateOnly: true,
    },
  
    "HQ Tour Plan": {
      show: ["title", "startDate", "endDate", "salesPartner","employees"],
      hide: ["description"],
      required: ["title", "startDate", "salesPartner"],
      dateRange: true,
    },
    "Todo List": {
        show: ["title", "startDate", "endDate", "employees","description"],
        hide: ["salesPartner"],
        required: ["title", "startDate", "employees"],
        dateRange: true,
      },
      "Leave": {
        show: ["title", "startDate", "endDate", "employees","description"],
        hide: ["salesPartner"],
        required: ["title", "startDate", "employees"],
        dateRange: true,
      },
      "Meeting": {
        show: ["title", "startDate", "endDate", "employees"],
        hide: ["description","salesPartner"],
        required: ["title", "startDate", "employees"],
        dateRange: true,
      },
      "Doctor Visit Plan": {
        show: ["title", "startDate", "endDate", "employees","salesPartner"],
        hide: ["description"],
        required: ["title", "startDate", "employees","salesPartner"],
        dateRange: true,
      },
  
    DEFAULT: {
      show: [
        "title",
        "startDate",
        "endDate",
        "description",
        "color",
        "employees",
      ],
      hide: [
      ],
      required: [
        "title",
        "startDate",
      ],
    },
  };
  