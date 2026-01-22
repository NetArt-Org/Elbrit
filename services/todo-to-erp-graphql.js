import { format } from "date-fns";
import { LOGGED_IN_USER } from "@/components/auth/calendar-users";

export function mapFormToErpTodo(values, options = {}) {
    const { erpName, employeeOptions = [] } = options;
  
    const employeeId = Array.isArray(values.employees)
      ? values.employees[0]
      : values.employees;
  
    const employee = employeeOptions.find(
      (e) => e.value === employeeId
    );
  console.log("EMPLOYEE",employee,employeeOptions)
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
    };
  
    if (erpName) {
      doc.name = erpName;
    }
  
    return doc;
  }
  
