import { toast } from "sonner";
export function showFirstFormErrorAsToast(errors) {
  const findError = (obj) => {
    for (const key in obj) {
      if (obj[key]?.message) return obj[key].message;
      if (typeof obj[key] === "object") {
        const nested = findError(obj[key]);
        if (nested) return nested;
      }
    }
  };

  const message = findError(errors);
  if (message) toast.error(message);
}

export function getAvailableItems(allItems, selectedRows, currentValue) {
  const selectedIds = (selectedRows ?? [])
    .map(r => r.item__name)
    .filter(Boolean);

  return allItems.filter(item => {
    // ✅ keep current row item
    if (item.value === currentValue) return true;

    // ❌ remove items selected in other rows
    return !selectedIds.includes(item.value);
  });
}

  
  export function updatePobRow(form, index, patch) {
    const rows = [...(form.getValues("fsl_doctor_item") ?? [])];
  
    const current = rows[index] ?? {};
    const next = { ...current, ...patch };
  
    const qty = Number(next.qty || 0);
    const rate = Number(next.rate || 0);
  
    next.amount = qty * rate;
  
    rows[index] = next;
  
    form.setValue("fsl_doctor_item", rows, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }
  