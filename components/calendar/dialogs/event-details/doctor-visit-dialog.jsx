"use client";

import { useMemo, useState } from "react";
import Tiptap from "@calendar/components/ui/TodoWysiwyg";
import { toast } from "sonner";
import { Button } from "@calendar/components/ui/button";
import { TAG_FORM_CONFIG } from "@calendar/lib/calendar/form-config";
import { ScrollArea } from "@calendar/components/ui/scroll-area";
import { useCalendar } from "@calendar/components/calendar/contexts/calendar-context";
import { AddEditEventDialog } from "@calendar/components/calendar/dialogs/add-edit-event-dialog";
import { saveEvent } from "@calendar/services/event.service";
import { TAG_IDS } from "@calendar/components/calendar/constants";
import { LOGGED_IN_USER } from "@calendar/components/auth/calendar-users";
// import { resolveDoctorVisitState, submitDoctorVisitLocation } from "@calendar/lib/doctorVisitState";
import { buildParticipantsWithDetails } from "@calendar/lib/helper";
import { useDeleteEvent } from "../../hooks";
import { useDoctorResolvers } from "@calendar/lib/doctorResolver";
import { useEmployeeResolvers } from "@calendar/lib/employeeResolver";
import { joinDoctorVisit, leaveDoctorVisit } from "@calendar/lib/helper";
/* =====================================================
   PURE HELPERS (NO LOGIC CHANGE)
===================================================== */

function resolveDoctorDetails(event, doctorResolvers) {
  const doctorRef = event.participants?.find(
    (p) => p.type === "Lead"
  );

  const doctorId = doctorRef?.id;
  if (!doctorId) return null;

  return {
    doctorId,
    doctorName:
      doctorResolvers.getDoctorNameById(doctorId) ?? "",
    doctorCity:
      doctorResolvers.getDoctorFieldById(doctorId, "city") ?? "",
    doctorSpeciality:
      doctorResolvers.getDoctorFieldById(
        doctorId,
        "fsl_speciality__name"
      ) ?? "",
    doctorCode:
      doctorResolvers.getDoctorFieldById(
        doctorId,
        "code"
      ) ?? "",

    // ✅ ADD THIS
    doctorNotes:
      doctorResolvers.getDoctorFieldById(
        doctorId,
        "notes"
      ) ?? [],
  };
}


function resolveEmployeeParticipants(event, employeeResolvers) {
  const allowedPrefixes = ["SM", "ABM", "RBM", "BE", "Admin"];

  return (
    event.participants
      ?.filter((p) => p.type === "Employee")
      .map((p) => {

        const roleId =
          employeeResolvers.getEmployeeFieldById(
            p.id,
            "roleId"
          );
        console.log("roleId for", p.id, roleId);
        if (!roleId) return null;

        const rolePrefix = roleId.split("-")[0];
        const cleanPrefix = rolePrefix.replace(/[0-9]/g, "");

        if (!allowedPrefixes.includes(cleanPrefix))
          return null;

        return {
          name:
            employeeResolvers.getEmployeeNameById(
              p.id
            ) ?? p.id,
          role: cleanPrefix,
        };
      })
      .filter(Boolean) ?? []
  );
}

/* =====================================================
   COMPONENT
===================================================== */

export function EventDoctorVisitDialog({
  event,
  open,
  setOpen,
}) {
  const {
    removeEvent,
    employeeOptions,
    doctorOptions,
    addEvent,
  } = useCalendar();
  const [showEditor, setShowEditor] = useState(false);
  const [newNote, setNewNote] = useState("");

  const { handleDelete } = useDeleteEvent({
    removeEvent,
    onClose: () => setOpen(false),
  });

  const doctorResolvers = useDoctorResolvers(doctorOptions);
  const employeeResolvers = useEmployeeResolvers(employeeOptions);

  const tagConfig =
    TAG_FORM_CONFIG[event.tags] ?? TAG_FORM_CONFIG.DEFAULT;

  // const visitState = resolveDoctorVisitState(
  //   event,
  //   LOGGED_IN_USER.id
  // );

  /* ================= Permissions ================= */

  const isDoctorVisit =
    event.tags === TAG_IDS.DOCTOR_VISIT_PLAN;

  const isEmployeeParticipant =
    event.participants?.some(
      (p) =>
        p.type === "Employee" &&
        String(p.id) === String(LOGGED_IN_USER.id)
    ) ?? false;

  const permissions = useMemo(() => {
    return {
      canJoin:
        isDoctorVisit && !isEmployeeParticipant,
      canVisitNow:
        isDoctorVisit && isEmployeeParticipant,
      canLeave:
        isDoctorVisit && isEmployeeParticipant,
      canDelete:
        tagConfig.ui?.allowDelete?.(event) ?? true,
      canEdit:
        tagConfig.ui?.allowEdit?.(event) ?? true,
    };
  }, [
    isDoctorVisit,
    isEmployeeParticipant,
    tagConfig,
    event,
  ]);


  /* ================= Doctor Info ================= */

  const doctorDetails = useMemo(
    () => resolveDoctorDetails(event, doctorResolvers),
    [event.participants, doctorResolvers]
  );

  /* ================= Participants ================= */

  const employeeParticipants = useMemo(
    () =>
      resolveEmployeeParticipants(
        event,
        employeeResolvers
      ),
    [event.participants, employeeResolvers]
  );

  /* ================= Join Logic ================= */

  const handleJoin = async () => {
    try {
      const existingParticipants =
        event.event_participants?.map((p) => ({
          reference_doctype: p.reference_doctype,
          reference_docname: p.reference_docname,
        })) || [];

      await joinDoctorVisit({
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
  const handleLeaveVisit = async () => {
    try {
      const existingParticipants =
        event.event_participants?.map((p) => ({
          reference_doctype: p.reference_doctype,
          reference_docname: p.reference_docname,
        })) || [];

      await leaveDoctorVisit({
        erpName: event.erpName,
        existingParticipants,
        employeeId: LOGGED_IN_USER.id,
      });

      const updatedParticipants = existingParticipants.filter(
        (p) =>
          !(
            p.reference_doctype === "Employee" &&
            String(p.reference_docname) === String(LOGGED_IN_USER.id)
          )
      );

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

      toast.success("You have left the visit");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to leave visit");
    }
  };
  console.log("EVENT", event)
  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      <ScrollArea className="max-h-[80vh]">
        <div className="p-2 space-y-4">

          {/* Doctor Section */}
          {doctorDetails?.doctorId && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Doctor Name
              </p>

              <p className="text-sm text-muted-foreground">
                {doctorDetails.doctorName}
                {doctorDetails.doctorSpeciality && (
                  <span className="block py-1 text-sm font-medium">
                    {doctorDetails.doctorSpeciality}
                  </span>
                )}
              </p>

              <div className="flex gap-4 text-sm">
                {doctorDetails.doctorCode && (
                  <span className="text-blue-600 font-medium">
                    {doctorDetails.doctorCode}
                  </span>
                )}

                {doctorDetails.doctorCity && (
                  <span className="text-muted-foreground">
                    {doctorDetails.doctorCity}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Participants */}
          {employeeParticipants.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Participants
              </p>

              <div className="space-y-2">
                {employeeParticipants.map(
                  (p, index) => (
                    <div
                      key={index}
                      className="flex justify-start gap-6 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {p.name}
                      </span>
                      <span className="text-muted-foreground">
                        {p.role}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
          {/* ================= Notes Section ================= */}
          {doctorDetails?.doctorNotes?.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">
                  Notes
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditor(true)}
                >
                  + Add
                </Button>
              </div>

              {doctorDetails.doctorNotes.map((note, index) => (
                <div
                  key={index}
                  className="rounded-md border p-3 text-sm"
                  dangerouslySetInnerHTML={{ __html: note }}
                />
              ))}
            </div>
          )}
          {showEditor && (
            <div className="space-y-2 border rounded-md p-3">
              <Tiptap
                content={newNote}
                onChange={setNewNote}
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowEditor(false);
                    setNewNote("");
                  }}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleSaveNote}
                >
                  Save
                </Button>
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex justify-end gap-2">
        {permissions.canEdit && (
          <>
            {permissions.canJoin && (
              <Button
                variant="success"
                onClick={handleJoin}
              >
                Join
              </Button>
            )}

            {/* {visitState.needsLocation && (
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
            )} */}

            {permissions.canVisitNow && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleLeaveVisit}
                >
                  Remove
                </Button>
                <AddEditEventDialog
                  event={event}
                  forceValues={
                    tagConfig.ui?.primaryEditAction
                      ?.setOnEdit
                  }
                >
                  <Button>
                    {tagConfig.ui?.primaryEditAction
                      ?.label ?? "Visit"}
                  </Button>
                </AddEditEventDialog>

              </>
            )}
          </>
        )}

        {/* {permissions.canDelete && (
          <Button
            variant="destructive"
            onClick={() =>
              handleDelete(event.erpName)
            }
          >
            Delete
          </Button>
        )} */}
      </div>
    </>
  );
}

const handleSaveNote = async () => {
  try {
    if (!newNote) return;

    await addLeadNote(
      doctorDetails.doctorId,
      doctorDetails.doctorNotes,
      newNote
    );

    toast.success("Note added");

    setShowEditor(false);
    setNewNote("");

    // Optional: refresh doctorOptions
    // or manually push into local state
  } catch (err) {
    console.error(err);
    toast.error("Failed to save note");
  }
};
