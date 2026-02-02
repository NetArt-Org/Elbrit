export function getAvailableItems(allItems, selectedItems) {
    const used = new Set(
      (selectedItems ?? [])
        .map(i => i.item__name)
        .filter(Boolean) // safety
    );
  
    return allItems.filter(item => !used.has(item.value));
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
  