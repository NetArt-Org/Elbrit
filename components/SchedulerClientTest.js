"use client";

import "smart-webcomponents-react/source/styles/smart.default.css";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";

import { Button } from "smart-webcomponents-react/button";
import { Input } from "smart-webcomponents-react/input";
import { DateTimePicker } from "smart-webcomponents-react/datetimepicker";
// import { DatePicker } from "smart-webcomponents-react/datepicker";
import { SwitchButton } from "smart-webcomponents-react/switchbutton";
import { DropDownList } from "smart-webcomponents-react/dropdownlist";

// Scheduler (client only)
const Scheduler = dynamic(
    () => import("smart-webcomponents-react/scheduler"),
    { ssr: false }
);

export default function SchedulerClientTest() {
    const schedulerRef = useRef();

    // -----------------------------
    // Create Modal State
    // -----------------------------
    const [modal, setModal] = useState({
        open: false,
        type: "meeting", // meeting | task | birthday
        label: "",
        dateStart: new Date(),
        dateEnd: new Date(Date.now() + 60 * 60 * 1000),
        allDay: false,
        repeatYearly: true,
    });

    // -----------------------------
    // Open Create Modal
    // -----------------------------
    const openCreate = (type = "meeting", date) => {
        setModal({
            open: true,
            type,
            label: "",
            dateStart: date || new Date(),
            dateEnd: new Date(Date.now() + 60 * 60 * 1000),
            allDay: type === "birthday",
            repeatYearly: true,
        });
    };

    // -----------------------------
    // Save Event
    // -----------------------------
    const saveEvent = () => {
        const sched = schedulerRef.current;

        if (!modal.label) return;

        const event = {
            label: modal.label,
            dateStart: modal.dateStart,
            dateEnd: modal.allDay ? modal.dateStart : modal.dateEnd,
            allDay: modal.allDay,
            class: modal.type,
        };

        // Birthday logic
        if (modal.type === "birthday") {
            event.repeat = {
                repeatFreq: "yearly",
                repeatInterval: 1,
            };
        }

        // Task logic
        if (modal.type === "task") {
            event.status = "tentative";
        }

        sched.addEvent(event);
        setModal({ ...modal, open: false });
    };

    // -----------------------------
    // Scheduler Config
    // -----------------------------
    const views = ["day", "week", "month", "agenda"];

    return (
        <>
            {/* CREATE BUTTON */}
            <Button
                className="create-btn"
                onClick={() => openCreate("meeting")}
            >
                + Create
            </Button>

            {/* SCHEDULER */}
            <Scheduler
                ref={schedulerRef}
                view="month"
                views={views}
                disableEventEdit
                disableEventMenu
                disableDateMenu
                onCellClick={(e) => openCreate("meeting", e.detail.date)}
            />

            {/* CREATE MODAL */}
            {modal.open && (
                <div className="gc-overlay">
                    <div className="gc-modal">
                        {/* HEADER */}
                        <div className="gc-header">
                            <Input
                                placeholder="Add title"
                                value={modal.label}
                                onChange={(e) =>
                                    setModal({ ...modal, label: e.detail.value })
                                }
                            />
                            <button
                                className="close"
                                onClick={() => setModal({ ...modal, open: false })}
                            >
                                ✕
                            </button>
                        </div>

                        {/* TABS */}
                        <div className="gc-tabs">
                            {["meeting", "task", "birthday"].map((t) => (
                                <button
                                    key={t}
                                    className={modal.type === t ? "active" : ""}
                                    onClick={() =>
                                        setModal({
                                            ...modal,
                                            type: t,
                                            allDay: t === "birthday",
                                        })
                                    }
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* BODY */}
                        <div className="gc-body">
                            {/* MEETING */}
                            {modal.type === "meeting" && (
                                <>
                                    <DateTimePicker
                                        value={modal.dateStart}
                                        onChange={(e) =>
                                            setModal({ ...modal, dateStart: e.detail.value })
                                        }
                                    />
                                    <DateTimePicker
                                        value={modal.dateEnd}
                                        onChange={(e) =>
                                            setModal({ ...modal, dateEnd: e.detail.value })
                                        }
                                    />
                                </>
                            )}

                            {/* TASK */}
                            {modal.type === "task" && (
                                <>
                                    {/* <DatePicker
                    value={modal.dateStart}
                    onChange={(e) =>
                      setModal({ ...modal, dateStart: e.detail.value })
                    }
                  /> */}
                                    <input
                                        type="date"
                                        value={modal.dateStart.toISOString().split("T")[0]}
                                        onChange={(e) =>
                                            setModal({
                                                ...modal,
                                                dateStart: new Date(e.target.value),
                                            })
                                        }
                                        className="native-date"
                                    />

                                    <DropDownList
                                        dataSource={["High", "Medium", "Low"]}
                                        placeholder="Priority"
                                    />
                                </>
                            )}

                            {/* BIRTHDAY */}
                            {modal.type === "birthday" && (
                                <>
                                    {/* <DatePicker
                                        value={modal.dateStart}
                                        onChange={(e) =>
                                            setModal({ ...modal, dateStart: e.detail.value })
                                        }
                                    /> */}
                                    <input
                                        type="date"
                                        value={modal.dateStart.toISOString().split("T")[0]}
                                        onChange={(e) =>
                                            setModal({
                                                ...modal,
                                                dateStart: new Date(e.target.value),
                                            })
                                        }
                                        className="native-date"
                                    />

                                    <div className="row">
                                        <span>Repeat yearly</span>
                                        <SwitchButton checked />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* FOOTER */}
                        <div className="gc-footer">
                            <Button onClick={saveEvent}>Save</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
