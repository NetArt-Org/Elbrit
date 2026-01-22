import { Calendar, Clock, Text, User } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { formatTime } from "@/components/calendar/helpers";

const ICONS = {
  owner: User,
  date: Calendar,
  datetime: Clock,
  text: Text,
};

export function EventDetailsFields({ event, config, use24HourFormat }) {
  if (!config?.details?.fields) return null;

  return (
    <div className="space-y-4">
      {config.details.fields.map((field) => {
        const Icon = ICONS[field.type] ?? Text;
        let value = event[field.key];

        if (!value) return null;

        if (field.type === "owner") {
          value = event.owner?.name;
        }

        if (field.type === "date") {
          const d = typeof value === "string" ? parseISO(value) : new Date(value);
          if (!isValid(d)) return null;

          value = format(d, "EEEE dd MMMM");
        }

        if (field.type === "datetime") {
          const d = typeof value === "string" ? parseISO(value) : new Date(value);
          if (!isValid(d)) return null;

          value = (
            <>
              {format(d, "EEEE dd MMMM")}
              <span className="mx-1">at</span>
              {formatTime(d, use24HourFormat)}
            </>
          );
        }

        return (
          <div key={field.key} className="flex items-start gap-2">
            <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{field.label}</p>
              <p className="text-sm text-muted-foreground">{value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
