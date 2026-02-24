"use client";

import { useMemo } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { ScrollArea } from "@calendar/components/ui/scroll-area";
import { Button } from "@calendar/components/ui/button";
import { useCalendar } from "@calendar/components/calendar/contexts/calendar-context";
import { useEmployeeResolvers } from "@calendar/lib/employeeResolver";
import { TAG_FORM_CONFIG } from "@calendar/lib/calendar/form-config";
import { AddEditEventDialog } from "@calendar/components/calendar/dialogs/add-edit-event-dialog";
import { useDeleteEvent } from "../../hooks";
import { TAG_IDS } from "@calendar/components/calendar/constants";

/* =====================================================
   PURE HELPERS
===================================================== */

function resolveAssignedTo(event, employeeResolvers) {
  if (!event?.allocated_to) return null;

  return {
    id: event.allocated_to,
    name:
      employeeResolvers.getEmployeeNameById(event.allocated_to) ??
      event.allocated_to,
  };
}

function getDueDateMeta(startDate) {
  if (!startDate) return null;

  const parsed = parseISO(startDate);
  const today = new Date();

  return {
    formatted: format(parsed, "dd/MM/yyyy"),
    diffDays: differenceInCalendarDays(parsed, today),
  };
}

function getPriorityClass(priority) {
  switch (priority) {
    case "HIGH":
      return "text-red-600";
    case "MEDIUM":
      return "text-orange-500";
    case "LOW":
      return "text-green-600";
    default:
      return "text-muted-foreground";
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "OPEN":
      return "bg-orange-400";
    case "CLOSED":
      return "bg-green-600";
    default:
      return "bg-gray-400";
  }
}

/* =====================================================
   COMPONENT
===================================================== */

export function EventTodoDialog({
  event,
  open,
  setOpen,
}) {
  const { removeEvent, employeeOptions } = useCalendar();
console.log("EVENT",event)
  const employeeResolvers =
    useEmployeeResolvers(employeeOptions);

  const tagConfig =
    TAG_FORM_CONFIG[event.tags] ??
    TAG_FORM_CONFIG.DEFAULT;

  /* ================= Derived Data ================= */

  const assignedTo = useMemo(
    () =>
      resolveAssignedTo(
        event,
        employeeResolvers
      ),
    [event.allocated_to, employeeResolvers]
  );

  const dueDate = useMemo(
    () => getDueDateMeta(event.startDate),
    [event.startDate]
  );

  const permissions = useMemo(() => {
    return {
      canDelete:
        tagConfig.ui?.allowDelete?.(event) ?? true,
      canEdit:
        tagConfig.ui?.allowEdit?.(event) ?? true,
    };
  }, [tagConfig, event]);

  /* ================= Delete Logic ================= */

  const { handleDelete } = useDeleteEvent({
    removeEvent,
    onClose: () => setOpen(false),
  });

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      <ScrollArea className="max-h-[80vh]">
        <div className="p-4 space-y-6">

          {/* ================= HEADER ================= */}
          <div className="flex justify-between items-start">

            {/* Due Date */}
            <div>
              <p className="text-sm font-medium">
                Due Date
              </p>
              {dueDate ? (
                <p className="text-sm text-muted-foreground">
                  {dueDate.formatted}{" "}
                  ({dueDate.diffDays} days)
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  -
                </p>
              )}
            </div>

            {/* Status */}
            <div className="text-right">
              <p className="text-sm font-medium">
                Status
              </p>
              <span
                className={`text-white text-xs px-3 py-1 rounded-md ${getStatusBadgeClass(
                  event.status
                )}`}
              >
                {event.status}
              </span>
            </div>
          </div>

          {/* ================= ASSIGNED + PRIORITY ================= */}
          <div className="flex justify-between items-start">

            {/* Assigned To */}
            <div>
              <p className="text-sm font-medium">
                Assigned To
              </p>
              <p className="text-sm text-muted-foreground">
                {assignedTo?.name ?? "-"}
              </p>
            </div>

            {/* Priority */}
            <div className="text-right">
              <p className="text-sm font-medium">
                Priority
              </p>
              <p
                className={`text-sm font-medium ${getPriorityClass(
                  event.priority
                )}`}
              >
                {event.priority ?? "-"}
              </p>
            </div>
          </div>

          {/* ================= VISIBLE TO (Custom Placeholder) ================= */}
          <div>
            <p className="text-sm font-medium">
              Visible To
            </p>

            <div className="flex gap-2 mt-2 flex-wrap">
              {/* Temporary Static */}
              <span className="bg-muted px-2 py-1 rounded text-xs">
                Subash M
              </span>
              <span className="bg-muted px-2 py-1 rounded text-xs">
                Sanjay
              </span>
            </div>
          </div>

          {/* ================= DESCRIPTION ================= */}
          <div>
            <p className="text-sm font-medium mb-2">
              Description
            </p>

            {event.description ? (
              <div
                className="border rounded-md p-3 text-sm"
                dangerouslySetInnerHTML={{
                  __html: event.description,
                }}
              />
            ) : (
              <div className="border rounded-md p-3 text-sm text-muted-foreground">
                No description
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* ================= FOOTER ================= */}
      <div className="flex justify-end gap-2 p-4 border-t">

        {permissions.canEdit && (
          <AddEditEventDialog
            event={event}
            forceValues={
              tagConfig.ui?.primaryEditAction
                ?.setOnEdit
            }
          >
            <Button>
              {tagConfig.ui?.primaryEditAction
                ?.label ?? "Edit"}
            </Button>
          </AddEditEventDialog>
        )}

        {permissions.canDelete && (
          <Button
            variant="destructive"
            onClick={() =>
              handleDelete(event.erpName)
            }
          >
            Delete
          </Button>
        )}
      </div>
    </>
  );
}