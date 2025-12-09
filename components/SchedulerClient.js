"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useEffect } from "react";
import "smart-webcomponents-react/source/styles/smart.default.css";

/* --- Dynamic React wrappers (ssr: false) --- */
const Button = dynamic(() => import("smart-webcomponents-react/button").then(m => m.Button), { ssr: false });
const Calendar = dynamic(() => import("smart-webcomponents-react/calendar").then(m => m.Calendar), { ssr: false });
const Input = dynamic(() => import("smart-webcomponents-react/input").then(m => m.Input), { ssr: false });
const Tree = dynamic(() => import("smart-webcomponents-react/tree").then(m => m.Tree), { ssr: false });
const TreeItem = dynamic(() => import("smart-webcomponents-react/tree").then(m => m.TreeItem), { ssr: false });
const TreeItemsGroup = dynamic(() => import("smart-webcomponents-react/tree").then(m => m.TreeItemsGroup), { ssr: false });
const Scheduler = dynamic(() => import("smart-webcomponents-react/scheduler").then(m => m.Scheduler), { ssr: false });

export default function SchedulerClient() {
  const scheduler = useRef(null);
  const calendar = useRef(null);
  const tree = useRef(null);
  const primaryContainer = useRef(null);

  const today = new Date();
  const currentDate = today.getDate();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // fixed typo
  const currentHours = today.getHours();
  const currentMinutes = today.getMinutes();

  const thanksgiving = (() => {
    const tempDate = new Date(currentYear, 10, 1);
    tempDate.setDate(tempDate.getDate() - tempDate.getDay() + 25);
    return tempDate;
  })();


  // sample initial data (shortened). Expand with your original events as needed.
  const initialData = [{
    label: 'Brochure Design Review',
    dateStart: new Date(currentYear, currentMonth, 10, 13, 15),
    dateEnd: new Date(currentYear, currentMonth, 12, 16, 15),
    status: 'tentative',
    class: 'event'
}, {
    label: 'Website Re-Design Plan',
    dateStart: new Date(currentYear, currentMonth, 16, 16, 45),
    dateEnd: new Date(currentYear, currentMonth, 18, 11, 15),
    class: 'event'
}, {
    label: 'Update Sales Strategy Documents',
    dateStart: new Date(currentYear, currentMonth, 2, 12, 0),
    dateEnd: new Date(currentYear, currentMonth, 2, 13, 45),
    class: 'event',
    repeat: {
        repeatFreq: 'daily',
        repeatInterval: 2,
        repeatEnd: 5,
        exceptions: [{
            date: new Date(currentYear, currentMonth, 4, 12, 0),
            label: 'Employee on sick leave. Reschedule for next day',
            dateStart: new Date(currentYear, currentMonth, 5),
            dateEnd: new Date(currentYear, currentMonth, 6),
            status: 'outOfOffice',
            backgroundColor: '#F06292'
        },
        {
            date: new Date(currentYear, currentMonth, 8, 12, 0),
            label: 'Employee on sick leave. Reschedule for next day',
            dateStart: new Date(currentYear, currentMonth, 9),
            dateEnd: new Date(currentYear, currentMonth, 10),
            status: 'outOfOffice',
            backgroundColor: '#FFA000'
        }
        ]
    }
}, {
    label: 'Non-Compete Agreements',
    dateStart: new Date(currentYear, currentMonth, currentDate - 1, 8, 15),
    dateEnd: new Date(currentYear, currentMonth, currentDate - 1, 9, 0),
    status: 'outOfOffice',
    class: 'event'
}, {
    label: 'Approve Hiring of John Jeffers',
    dateStart: new Date(currentYear, currentMonth, currentDate + 1, 10, 0),
    dateEnd: new Date(currentYear, currentMonth, currentDate + 1, 11, 15),
    notifications: [{
        interval: 1,
        type: 'days',
        time: [currentHours, currentMinutes],
        message: 'Approve Hiring of John Jeffers tomorrow',
        iconType: 'success'
    }],
    status: 'busy',
    class: 'event'
}, {
    label: 'Update NDA Agreement',
    dateStart: new Date(currentYear, currentMonth, currentDate - 2, 11, 45),
    dateEnd: new Date(currentYear, currentMonth, currentDate - 2, 13, 45),
    class: 'event'
}, {
    label: 'Update Employee Files with New NDA',
    dateStart: new Date(currentYear, currentMonth, currentDate + 2, 14, 0),
    dateEnd: new Date(currentYear, currentMonth, currentDate + 2, 16, 45),
    class: 'event'
}, {
    label: 'Compete Agreements',
    dateStart: new Date(currentYear, currentMonth, currentDate, currentHours, currentMinutes + 15),
    dateEnd: new Date(currentYear, currentMonth, currentDate, currentHours + 1, 45),
    notifications: [{
        interval: 0,
        type: 'days',
        time: [currentHours, currentMinutes + 1],
        message: 'Compete Agreements in 15 minutes',
        iconType: 'time'
    },
    {
        interval: 0,
        type: 'days',
        time: [currentHours, currentMinutes + 2],
        message: 'Compete Agreements in 14 minutes',
        iconType: 'warning'
    }
    ],
    status: 'outOfOffice',
    class: 'event'
}, {
    label: 'Approve Hiring of Mark Waterberg',
    dateStart: new Date(currentYear, currentMonth, currentDate + 3, 10, 0),
    dateEnd: new Date(currentYear, currentMonth, currentDate + 3, 11, 15),
    status: 'busy',
    class: 'event'
}, {
    label: 'Update Employees Information',
    dateStart: new Date(currentYear, currentMonth, currentDate, 14, 0),
    dateEnd: new Date(currentYear, currentMonth, currentDate, 16, 45),
    class: 'event',
    repeat: {
        repeatFreq: 'weekly',
        repeatInterval: 2,
        repeatOn: [2, 4],
        repeatEnd: new Date(2021, 5, 24)
    }
},
{
    label: 'Prepare Shipping Cost Analysis Report',
    dateStart: new Date(currentYear, currentMonth, currentDate + 1, 12, 30),
    dateEnd: new Date(currentYear, currentMonth, currentDate + 1, 13, 30),
    class: 'event',
    repeat: {
        repeatFreq: 'monthly',
        repeatInterval: 1,
        repeatOn: [new Date(currentYear, currentMonth, currentDate + 1)]
    }
}, {
    label: 'Provide Feedback on Shippers',
    dateStart: new Date(currentYear, currentMonth, currentDate + 1, 14, 15),
    dateEnd: new Date(currentYear, currentMonth, currentDate + 1, 16, 0),
    status: 'tentative',
    class: 'event'
}, {
    label: 'Complete Shipper Selection Form',
    dateStart: new Date(currentYear, currentMonth, currentDate + 1, 8, 30),
    dateEnd: new Date(currentYear, currentMonth, currentDate + 1, 10, 0),
    class: 'event'
}, {
    label: 'Upgrade Server Hardware',
    dateStart: new Date(currentYear, currentMonth, currentDate + 1, 12, 0),
    dateEnd: new Date(currentYear, currentMonth, currentDate + 1, 14, 15),
    class: 'event'
}, {
    label: 'Upgrade Apps to Windows RT or stay with WinForms',
    dateStart: new Date(currentYear, currentMonth, currentDate + 2, currentHours, currentMinutes + 5),
    dateEnd: new Date(currentYear, currentMonth, currentDate + 2, currentHours + 2),
    status: 'tentative',
    class: 'event',
    repeat: {
        repeatFreq: 'daily',
        repeatInterval: 1,
        repeatOn: currentDate + 1,
        repeatEnd: new Date(currentYear, currentMonth, currentDate + 7),
        exceptions: [{
            date: new Date(currentYear, currentMonth, currentDate + 4, 10, 30),
            label: 'A day off work',
            status: 'busy',
            backgroundColor: '#64DD17'
        }]
    },
    notifications: [{
        interval: 2,
        type: 'days',
        time: [currentHours, currentMinutes],
        message: 'Upgrade Apps to Windows RT in 5 minutes',
        iconType: 'time'
    }],
},
{
    label: 'Peter\'s Birthday',
    dateStart: new Date(currentYear, currentMonth, 5),
    dateEnd: new Date(currentYear, currentMonth, 6),
    class: 'birthday'
},
{
    label: 'Michael\'s Brithday',
    dateStart: new Date(currentYear, currentMonth, 10),
    dateEnd: new Date(currentYear, currentMonth, 11),
    class: 'birthday'
},
{
    label: 'Christina\'s Birthday',
    dateStart: new Date(currentYear, currentMonth, 20),
    dateEnd: new Date(currentYear, currentMonth, 21),
    class: 'birthday'
}, {
    label: 'Halloween',
    dateStart: new Date(currentYear, 9, 31),
    dateEnd: new Date(currentYear, 9, 32),
    class: 'holiday'
}, {
    label: 'Marry Christmas',
    dateStart: new Date(currentYear, 11, 24),
    dateEnd: new Date(currentYear, 11, 26, 23, 59, 59),
    class: 'holiday'
},
{
    label: 'Thanksgiving',
    dateStart: thanksgiving,
    dateEnd: new Date(currentYear, 10, thanksgiving.getDate() + 1),
    class: 'holiday'
},
{
    label: 'Day after Thanksgiving',
    dateStart: new Date(currentYear, 10, thanksgiving.getDate() + 1),
    dateEnd: new Date(currentYear, 10, thanksgiving.getDate() + 2),
    class: 'holiday'
},
{
    label: 'Indipendence Day',
    dateStart: new Date(currentYear, 6, 4),
    dateEnd: new Date(currentYear, 6, 5),
    class: 'holiday'
},
{
    label: 'New Year\'s Eve',
    dateStart: new Date(currentYear, 11, 31),
    dateEnd: new Date(currentYear + 1, 0, 1),
    class: 'holiday'
}
];

  const [data, setData] = useState(initialData);

  const nonworkingDays = Array.from({ length: 3 }).map((_, i) => (today.getDay() - i + 7) % 7);

  const views = [
    "day",
    { type: "week", hideWeekend: true },
    { type: "month", hideWeekend: true },
    "agenda",
    { label: "4 days", value: "workWeek", type: "week", shortcutKey: "X", hideWeekend: false, hideNonworkingWeekdays: true },
  ];

  const handleToggle = () => {
    const el = primaryContainer.current;
    const sched = scheduler.current;
    if (!el || !sched) return;
    el.classList.toggle("collapse");
    sched.disableDateMenu = !el.classList.contains("collapse");
  };

  // --- Create button: use nativeElement and the same internal factory Smart UI uses ---
  const addNew = () => {
    const schedWrapper = scheduler.current;
    const sched = schedWrapper?.nativeElement ?? schedWrapper; // fallback if wrapper exposes methods directly
    if (!sched) {
      console.warn("Scheduler native element not available yet");
      return;
    }

    // _createItemDetails exists on the native webcomponent; it returns a full default event object
    const newEvent = typeof sched._createItemDetails === "function" ? sched._createItemDetails() : {
      label: "",
      dateStart: new Date(),
      dateEnd: new Date(new Date().getTime() + 60 * 60 * 1000),
      class: "event",
    };

    // open window with full object
    if (typeof sched.openWindow === "function") {
      sched.openWindow(newEvent);
    } else {
      console.warn("openWindow() not available on scheduler native element");
    }
  };

  const handleCalendarChange = (event) => {
    const schedWrapper = scheduler.current;
    if (schedWrapper) schedWrapper.dateCurrent = event.detail.value;
  };

  const handleTreeChange = async () => {
    const selected = tree.current?.selectedIndexes ?? [];
    let types = [];
    for (let i = 0; i < selected.length; i++) {
      const node = await tree.current.getItem(selected[i]);
      types.push(node.value);
      if (i === selected.length - 1) {
        scheduler.current.dataSource = initialData.filter((d) => types.includes(d.class));
      }
    }
  };

  const handleDateChange = (event) => {
    if (calendar.current) calendar.current.selectedDates = [event.detail.value];
  };

  const updateData = (event) => {
    const item = event.detail?.item;
    if (!item) return;
    const newData = [...data];
    const index = newData.findIndex((d) => d.label === item.label && d.class === item.class);
    if (index !== -1) {
      event.type === "itemRemove" ? newData.splice(index, 1) : (newData[index] = item);
    } else {
      // optionally push new item if not found
      if (event.type !== "itemRemove") newData.push(item);
    }
    setData(newData);
  };

  return (
    <div id="primaryContainer" ref={primaryContainer} style={{ padding: 8 }}>
      <div id="header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button id="toggleButton" onClick={handleToggle}>Toggle</Button>
        <div id="title" style={{ fontWeight: 700 }}>Scheduler</div>
        <div style={{ marginLeft: "auto" }}>
          <Button id="addNew" className="floating" onClick={addNew}>
            <span>Create</span>
          </Button>
        </div>
      </div>

      <div className="content" style={{ display: "flex", gap: 16, marginTop: 12 }}>
        {/* LEFT SIDEBAR */}
        <section id="sideA" style={{ width: 300 }}>
          <div className="button-container" />
          <div className="controls-container">
            {/* Give Calendar explicit height so month view renders fully */}
            <Calendar ref={calendar} id="calendar" style={{ height: 320 }} scrollButtonsPosition="far" onChange={handleCalendarChange} />
            <Input id="searchBar" className="underlined" placeholder="Search for people" />
            <Tree ref={tree} id="tree" selectionMode="checkBox" toggleElementPosition="far" onChange={handleTreeChange}>
              <TreeItemsGroup expanded>
                My calendars
                <TreeItem value="birthday" selected>Birthdays</TreeItem>
                <TreeItem value="holiday" selected>Holidays</TreeItem>
                <TreeItem value="event" selected>Events</TreeItem>
              </TreeItemsGroup>
            </Tree>
          </div>
        </section>

        {/* RIGHT SIDE SCHEDULER */}
        <section id="sideB" style={{ flex: 1 }}>
          <Scheduler
            ref={scheduler}
            id="scheduler"
            dataSource={data}
            view="month"
            views={views}
            nonworkingDays={nonworkingDays}
            firstDayOfWeek={1}
            disableDateMenu={true}
            currentTimeIndicator={true}
            scrollButtonsPosition="far"
            onDragEnd={updateData}
            onResizeEnd={updateData}
            onItemUpdate={updateData}
            onItemRemove={updateData}
            onDateChange={handleDateChange}
          />
        </section>
      </div>
    </div>
  );
}
