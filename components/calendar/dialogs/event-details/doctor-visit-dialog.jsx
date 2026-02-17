"use client";
import { useRef, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@calendar/components/ui/button";
import { TAG_FORM_CONFIG } from "@calendar/lib/calendar/form-config";
import { ScrollArea } from "@calendar/components/ui/scroll-area";
import { useCalendar } from "@calendar/components/calendar/contexts/calendar-context";
import { AddEditEventDialog } from "@calendar/components/calendar/dialogs/add-edit-event-dialog";
import { saveEvent } from "@calendar/services/event.service";
import { TAG_IDS } from "@calendar/components/calendar/constants";
import { LOGGED_IN_USER } from "@calendar/components/auth/calendar-users";
import { resolveDoctorVisitState, submitDoctorVisitLocation } from "@calendar/lib/doctorVisitState";
import { buildParticipantsWithDetails } from "@calendar/lib/helper";
import { useDeleteEvent } from "../../hooks";
import { useDoctorResolvers } from "@calendar/lib/doctorResolver";
import { useEmployeeResolvers } from "@calendar/lib/employeeResolver";

export async function joinDoctorVisit({
  erpName,
  existingParticipants,
  employeeId,
}) {
  return saveEvent({
    name: erpName,
    event_participants: [
      ...existingParticipants,
      {
        reference_doctype: "Employee",
        reference_docname: employeeId,
      },
    ],
  });
}

export function EventDoctorVisitDialog({
  event,
  open,
  setOpen,
}) {
  const {
    use24HourFormat,
    removeEvent,
    employeeOptions,
    doctorOptions,
    addEvent,
  } = useCalendar();

  const { handleDelete } = useDeleteEvent({
    removeEvent,
    onClose: () => setOpen(false),
  });

  const isDoctorVisit = event.tags === TAG_IDS.DOCTOR_VISIT_PLAN;

  const visitState = resolveDoctorVisitState(
    event,
    LOGGED_IN_USER.id
  );
  const doctorResolvers = useDoctorResolvers(doctorOptions);
  const employeeResolvers = useEmployeeResolvers(employeeOptions);
  
  const isEmployeeParticipant =
    event.event_participants?.some(
      (p) =>
        p.reference_doctype === "Employee" &&
        String(p.reference_docname) === String(LOGGED_IN_USER.id)
    ) ?? false;
console.log("EVENT",event)
  const canJoinVisit = isDoctorVisit && !isEmployeeParticipant;
  const canVisitNow = isDoctorVisit && isEmployeeParticipant;

  const tagConfig =
    TAG_FORM_CONFIG[event.tags] ?? TAG_FORM_CONFIG.DEFAULT;

  const canDelete =
    tagConfig.ui?.allowDelete?.(event) ?? true;

  const canEdit =
    tagConfig.ui?.allowEdit?.(event) ?? true;

  const editAction = tagConfig.ui?.primaryEditAction;

  /* =====================================================
     DOCTOR RESOLUTION (FROM doctorOptions ONLY)
  ===================================================== */
  const doctorRef = event.event_participants?.find(
    (p) => p.reference_doctype === "Lead"
  );
  
  const doctorId = doctorRef?.reference_docname;
  
  const doctorName =
    doctorResolvers.getDoctorNameById(doctorId) ?? "";
  
  const doctorCity =
    doctorResolvers.getDoctorFieldById(doctorId, "city") ?? "";
  
  const doctorCode =
    doctorResolvers.getDoctorFieldById(doctorId, "code") ?? "";
  

  /* =====================================================
     PARTICIPANTS (ONLY SM, ABM, RBM, BE)
  ===================================================== */

  const employeeParticipants = useMemo(() => {
    const allowedPrefixes = ["SM", "ABM", "RBM", "BE"];
  
    return (
      event.event_participants
        ?.filter((p) => p.reference_doctype === "Employee")
        .map((p) => {
          const roleId =
            employeeResolvers.getEmployeeFieldById(
              p.reference_docname,
              "roleId"
            );
  
          if (!roleId) return null;
  
          // Extract first segment before "-"
          const rolePrefix = roleId.split("-")[0];
  
          // Remove numbers (ABM1 → ABM)
          const cleanPrefix = rolePrefix.replace(/[0-9]/g, "");
  
          if (!allowedPrefixes.includes(cleanPrefix))
            return null;
  
          return {
            name:
              employeeResolvers.getEmployeeNameById(
                p.reference_docname
              ) ?? p.reference_docname,
            role: cleanPrefix,
          };
        })
        .filter(Boolean) ?? []
    );
  }, [event.event_participants, employeeResolvers]);
  
  /* =====================================================
     JOIN LOGIC FIXED
  ===================================================== */

  const handleJoin = async () => {
    try {
      const existingParticipants =
        event.event_participants?.map((p) => ({
          reference_doctype: p.reference_doctype,
          reference_docname: p.reference_docname,
        })) || [];

      const saved = await joinDoctorVisit({
        erpName: event.erpName,
        existingParticipants,
        employeeId: LOGGED_IN_USER.id,
      });

      const updatedParticipants = [
        ...existingParticipants,
        {
          reference_doctype: "Employee",
          reference_docname: LOGGED_IN_USER.id,
        },
      ];

      const updatedEvent = {
        ...event,
        event_participants: updatedParticipants,
        participants: buildParticipantsWithDetails(
          updatedParticipants,
          { employeeOptions, doctorOptions }
        ),
      };

      removeEvent(event.erpName);
      addEvent(updatedEvent);

      toast.success("You have joined the visit");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to join visit");
    }
  };

  return (
    <>
      <ScrollArea className="max-h-[80vh]">
        <div className="p-2 space-y-4">

          {/* 🔷 Doctor Section */}
          {doctorId && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                Doctor Name
              </p>

              <p className="text-base font-medium">
                {doctorName}
              </p>
              <div className="flex gap-4 text-sm">
                {doctorCode && (
                  <span className="text-blue-600 font-medium">
                    {doctorCode}
                  </span>
                )}

                {doctorCity && (
                  <span className="text-muted-foreground">
                    {doctorCity}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 🔷 Participants Section */}
          {employeeParticipants.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">
                Participants
              </p>

              <div className="space-y-2">
                {employeeParticipants.map(
                  (p, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm"
                    >
                      <span>{p.name}</span>
                      <span className="text-muted-foreground font-medium">
                        {p.role}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 🔻 Footer Buttons */}
      <div className="flex justify-end gap-2">
        {canEdit && (
          <>
            {canJoinVisit && (
              <Button
                variant="outline"
                onClick={handleJoin}
              >
                Join Visit
              </Button>
            )}

            {visitState.needsLocation && (
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await submitDoctorVisitLocation({
                      event,
                      loggedInUserId:
                        LOGGED_IN_USER.id,
                      removeEvent,
                      addEvent,
                    });

                    toast.success(
                      "Location submitted successfully"
                    );
                    setOpen(false);
                  } catch {
                    toast.error(
                      "Failed to fetch location"
                    );
                  }
                }}
              >
                Request Location
              </Button>
            )}

            {canVisitNow && (
              <AddEditEventDialog
                event={event}
                forceValues={
                  editAction?.setOnEdit
                }
              >
                <Button variant="success">
                  {editAction?.label ??
                    "Visit Now"}
                </Button>
              </AddEditEventDialog>
            )}
          </>
        )}

        {canDelete && (
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
