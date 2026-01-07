import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function Calendar({ className, ...props }) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      components={{
        IconLeft: () => <ChevronLeft />,
        IconRight: () => <ChevronRight />,
      }}
      {...props}
    />
  );
}

export { Calendar };
