import { ChevronDown } from "lucide-react";

/** Native select with the chevron offset from the field edge. */
export function FieldSelect({
  id,
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <span className={`relative block ${className || ""}`}>
      <select
        id={id}
        aria-label={ariaLabel || id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-md border border-input bg-background py-2 pl-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </span>
  );
}
