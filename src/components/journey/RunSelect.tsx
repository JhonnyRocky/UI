import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function RunSelect({
  runs,
  value,
  onChange,
  id,
  className,
  formatLabel,
}: {
  runs: { id: string; run_number?: number; attempt?: number }[];
  value: string;
  onChange: (id: string) => void;
  id?: string;
  className?: string;
  formatLabel?: (run: { id: string; run_number?: number; attempt?: number }, index: number) => string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        className={cn("h-8 w-[9rem] shrink-0 text-xs", className)}
      >
        <SelectValue placeholder="Select run" />
      </SelectTrigger>
      <SelectContent>
        {runs.map((r, i) => (
          <SelectItem key={r.id} value={r.id} className="text-xs">
            {formatLabel ? formatLabel(r, i) : `Run ${r.run_number ?? runs.length - i}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
