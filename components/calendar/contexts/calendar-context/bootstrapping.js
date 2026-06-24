import { fetchAllCustomers } from "@calendar/components/calendar/module/event/services/event.service";
import { ELBRIT_ROLEID, normalizeRoleProfiles } from "@calendar/components/calendar/module/event/graphql/events.query";
import { fetchEmployeeNodes } from "@calendar/components/calendar/module/event/services/master-data.service";
import { mapEmployeesToCalendarUsers } from "@calendar/components/calendar/module/event/services/employee-to-calendar-user";
import { getCached } from "@calendar/lib/data-cache";
import { graphqlRequest } from "@calendar/lib/graphql-client";

const ROLE_CACHE_KEY = "ELBRIT_ROLE_PROFILES";

function mapEmployeesToOptions(employees = []) {
  return employees.map((employee) => ({
    doctype: "Employee",
    value: employee.name,
    label: employee.employee_name,
    email: employee.company_email,
    role: employee.designation?.name ?? null,
    roleId: employee.role_id,
    leave_approver: employee.leave_approver?.name ?? null,
  }));
}

async function fetchElbritRoleEdges() {
  return getCached(ROLE_CACHE_KEY, async () => {
    const rawData = await graphqlRequest(ELBRIT_ROLEID, {
      first: 1000,
    });

    const normalizedData = normalizeRoleProfiles(rawData);
    return normalizedData?.ElbritRoleIDS?.edges ?? [];
  });
}

function mapCustomersToOptions(customers = []) {
  return customers.map((name) => ({
    label: name,
    value: name,
  }));
}

export async function fetchCalendarBootstrapData() {
  const [employeesResult, rolesResult, customersResult] =
    await Promise.allSettled([
      fetchEmployeeNodes(),
      fetchElbritRoleEdges(),
      fetchAllCustomers(),
    ]);

  return {
    users:
      employeesResult.status === "fulfilled"
        ? mapEmployeesToCalendarUsers(employeesResult.value)
        : [],
    employeeOptions:
      employeesResult.status === "fulfilled"
        ? mapEmployeesToOptions(employeesResult.value)
        : [],
    elbritRoleEdges:
      rolesResult.status === "fulfilled"
        ? rolesResult.value
        : [],
    customerOptions:
      customersResult.status === "fulfilled"
        ? mapCustomersToOptions(customersResult.value)
        : [],
    errors: {
      employees:
        employeesResult.status === "rejected"
          ? employeesResult.reason
          : null,
      roles:
        rolesResult.status === "rejected"
          ? rolesResult.reason
          : null,
      customers:
        customersResult.status === "rejected"
          ? customersResult.reason
          : null,
    },
  };
}
