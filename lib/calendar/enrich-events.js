export function enrichEventsWithParticipants(
  events,
  employeeOptions,
  doctorOptions
) {
  if (!employeeOptions.length && !doctorOptions.length) {
    return events; // ⛔ do NOT mutate yet
  }

  return events.map(event => {
    if (!event.participants?.length) return event;

    const enrichedParticipants = event.participants.map(p => {
      if (p.type === "Employee") {
        const emp = employeeOptions.find(
          e => String(e.value) === String(p.id)
        );

        return emp
          ? { ...p, name: emp.label }
          : p;
      }

      if (p.type === "Lead") {
        const doc = doctorOptions.find(
          d => String(d.value) === String(p.id)
        );

        return doc
          ? { ...p, name: doc.label }
          : p;
      }

      return p;
    });

    return {
      ...event,
      participants: enrichedParticipants,
    };
  });
}
