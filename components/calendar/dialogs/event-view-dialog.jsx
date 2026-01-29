import { format } from "date-fns";

export function EventView({ event }) {
  return (
    <div className="grid gap-4">
      <ViewItem label="Title" value={event.title} />

      {event.tags === "Leave" && (
        <>
          <ViewItem label="Leave Type" value={event.leaveType} />
          <ViewItem label="Status" value={event.status} />
          <ViewItem label="From Date" value={format(new Date(event.startDate), "dd MMM yyyy")} />
          <ViewItem label="To Date" value={format(new Date(event.endDate), "dd MMM yyyy")} />
          <ViewItem label="Total Days" value={event.totalDays} />
        </>
      )}

      {event.tags === "Todo List" && (
        <>
          <ViewItem label="Priority" value={event.priority} />
          <ViewItem label="Status" value={event.status} />
          <ViewItem label="Allocated To" value={event.allocatedToName} />
        </>
      )}

      {event.description && (
        <ViewItem
          label="Description"
          value={<HtmlPreview html={event.description} />}
        />
      )}
    </div>
  );
}
function ViewItem({ label, value }) {
    return (
      <div className="grid gap-1">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">
          {value || "-"}
        </div>
      </div>
    );
  }
  