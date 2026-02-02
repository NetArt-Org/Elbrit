import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
  options = [],
  placeholder = "Select option",
  searchPlaceholder,
  disabled = false,
  selectionLabel = "item",
  multiple = false,
}) {
  const [open, setOpen] = useState(false);

  /* ---------------------------------------
     Helpers
  --------------------------------------- */
  const isObject = v => typeof v === "object" && v !== null;
  const getKey = v => (isObject(v) ? v.value : v);

  const selectedValues = multiple
    ? Array.isArray(value) ? value : []
    : value ? [value] : [];

  const selectedOptions = selectedValues
    .map(v => options.find(o => o.value === getKey(v)))
    .filter(Boolean);

  const hasSelection = selectedOptions.length > 0;

  /* ---------------------------------------
     Selection logic
  --------------------------------------- */
  const handleSelect = (opt) => {
    if (!multiple) {
      onChange(opt);
      setOpen(false);
      return;
    }

    const exists = selectedValues.some(v => getKey(v) === opt.value);

    if (exists) {
      onChange(selectedValues.filter(v => getKey(v) !== opt.value));
    } else {
      onChange([...selectedValues, opt]);
    }
  };

  const handleRemove = (optValue) => {
    if (!multiple) {
      onChange(undefined);
      return;
    }
    onChange(selectedValues.filter(v => getKey(v) !== optValue));
  };

  const isSelected = (opt) =>
    selectedValues.some(v => getKey(v) === opt.value);

  /* ---------------------------------------
     UI
  --------------------------------------- */
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
            <span className="truncate">
              {!hasSelection
                ? placeholder
                : multiple
                  ? `${selectedOptions.length} ${selectionLabel}${selectedOptions.length > 1 ? "s" : ""} selected`
                  : selectedOptions[0]?.label}
            </span>

            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-60 overflow-y-auto">
              <CommandEmpty>No results found.</CommandEmpty>

              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => handleSelect(opt)}
                    className="flex items-center"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected(opt) ? "opacity-100" : "opacity-0"
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

      {/* ---------------------------------------
         Selected tags (BOTTOM)
      --------------------------------------- */}
      {hasSelection && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => handleRemove(opt.value)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
