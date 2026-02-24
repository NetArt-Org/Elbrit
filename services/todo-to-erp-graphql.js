import { format,startOfDay, endOfDay  } from "date-fns";
import { LOGGED_IN_USER } from "@calendar/components/auth/calendar-users";
import { TAG_IDS } from "@calendar/components/calendar/constants";

export function mapFormToErpTodo(values, resolvers) {
  const selected = values.allocated_to;

  let email = null;

  // If combobox returns full option
  if (selected?.email) {
    email = selected.email;
  }
  // If only value (employeeId)
  else if (selected?.value) {
    email = resolvers.getEmployeeEmailById(selected.value);
  }
  // If raw employeeId
  else if (typeof selected === "string") {
    email = resolvers.getEmployeeEmailById(selected);
  }

  if (!email) {
    throw new Error("Unable to resolve employee email");
  }

  return {
    doctype: "ToDo",
    description: values.description || values.title,
    status: values.todoStatus,
    priority: values.priority,
    date: format(values.endDate, "yyyy-MM-dd"),
    allocated_to: email,
    assigned_by: LOGGED_IN_USER.id,
    docstatus: 0,
  };
}
export function mapErpTodoToCalendar(todo) {
  if (!todo?.date) {
    console.warn("Invalid todo date:", todo);
    return null; // prevent crash
  }

  const baseDate = new Date(todo.date);

  if (isNaN(baseDate.getTime())) {
    console.warn("Unparseable todo date:", todo.date);
    return null;
  }

  const start = startOfDay(baseDate);
  const end = endOfDay(baseDate);

  return {
    erpName: todo.name,
    title: `To Do List-${todo.name}`,
    description: todo.description,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    tags: TAG_IDS.TODO_LIST,
    color: "orange",
    isTodo: true,
    status: todo.status,
    priority: todo.priority,
    allocated_to:
      todo.allocated_to__name || todo.allocated_to,
  };
}
  
  
  