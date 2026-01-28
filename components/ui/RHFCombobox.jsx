import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function RHFCombobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  disabled = false,
  selectionLabel,
  multiple = false, // 🔑 NEW (default false)
}) {
  const [open, setOpen] = useState(false);
  const labelName = selectionLabel ?? "employee";

  const normalizedValue = multiple
  ? Array.isArray(value) ? value : []
  : typeof value === "string" ? value : undefined;
  const isSelected = (val) =>
    multiple
      ? normalizedValue.includes(val)
      : normalizedValue === val;
  

  const handleSelect = (val) => {
    if (!multiple) {
      onChange(val);
      setOpen(false);
      return;
    }

    // multi-select logic
    if (normalizedValue.includes(val)) {
      onChange(normalizedValue.filter(v => v !== val));
    } else {
      onChange([...normalizedValue, val]);
    }
    
  };

  const selectedLabel = multiple
  ? options
      .filter(o => normalizedValue.includes(o.value))
      .map(o => o.label)
      .join(", ")
  : options.find(o => o.value === normalizedValue)?.label;


  return (
    <>
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between"
        >
        <span className="block max-w-full truncate">
        {multiple && normalizedValue.length > 0
  ? `${normalizedValue.length} ${labelName}${normalizedValue.length > 1 ? "s" : ""} selected`
  : selectedLabel || placeholder}


</span>

          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      {/* ✅ SCROLL FIX IS HERE */}
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />

          <CommandList className="max-h-60 overflow-y-auto overscroll-contain">
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => handleSelect(opt.value)}
                  className="flex items-center"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isSelected(opt.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    {/* SELECTED TAGS */}
{multiple && normalizedValue.length > 0 && (
  <div className="mt-2 flex flex-wrap gap-2">
    {options
      .filter(o => normalizedValue.includes(o.value))
      .map(o => (
        <button
          key={o.value}
          type="button"
          className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
          onClick={() =>
            onChange(normalizedValue.filter(v => v !== o.value))
          }
        >
          {o.label}
          <span className="text-muted-foreground hover:text-foreground">×</span>
        </button>
      ))}
  </div>
)}

    </>
  );
}
