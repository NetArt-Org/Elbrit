export function mapErpTodoToCalendar(todo) {
    const date = new Date(todo.date);
  
    return {
      erpName: todo.name,
      title: todo.description,
      description: todo.description,
      startDate: date.toISOString(),
      endDate: date.toISOString(),
      tags: "Todo List",
      color: "orange",
  
      status: todo.status,
      priority: todo.priority,
  
      isTodo: true,
    };
  }
  