import { format,startOfDay, endOfDay  } from "date-fns";
import { LOGGED_IN_USER } from "@/components/auth/calendar-users";

export function mapFormToErpTodo(values, options = {}) {
    const { erpName, employeeOptions = [],referenceEventName } = options;
  
    const employeeId = Array.isArray(values.employees)
      ? values.employees[0]
      : values.employees;
  
    const employee = employeeOptions.find(
      (e) => e.value === employeeId
    );
    const allocatedTo = employee?.email;
  
    if (!allocatedTo) {
      throw new Error("Unable to resolve allocated_to user email");
    }
  
    const doc = {
      doctype: "ToDo",
      description: values.description || values.title,
      status: values.todoStatus,
      priority: values.priority,
      date: format(values.endDate, "yyyy-MM-dd"),
  
      allocated_to: allocatedTo, // ✅ EMAIL, NOT EMP ID
      assigned_by: LOGGED_IN_USER.id,
      docstatus: 0,
       // ✅ LINK TO EVENT
    reference_type: "Event",
    reference_name: referenceEventName,
    };
  
    if (erpName) {
      doc.name = erpName;
    }
  
    return doc;
  }
  
  export function mapErpTodoToCalendar(todo) {
    if (!todo?.date || !todo?.name) return null;

    const start = startOfDay(
      new Date(`${todo.date}T00:00:00`)
    );
  
    const end = endOfDay(
      new Date(`${todo.date}T00:00:00`)
    );
  
    return {
      erpName: todo.name,
      title: todo.description,
      description: todo.description,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      tags: "Todo List",
      color: "orange",
      isTodo: true,
      status: todo.status,
      priority: todo.priority,
    };
  }
  