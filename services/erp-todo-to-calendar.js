export function mapErpTodoToCalendar(todo) {
  const d = new Date(todo.date);

  const iso = !isNaN(d.getTime()) ? d.toISOString() : null;

  return {
    erpName: todo.name,
    title: todo.description,
    description: todo.description,

    startDate: iso,   // ✅ ISO STRING
    endDate: iso,     // ✅ ISO STRING

    tags: "Todo List",
    color: "orange",
    isTodo: true,
    status: todo.status,
    priority: todo.priority,
  };
}
