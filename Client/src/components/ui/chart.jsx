import * as React from "react";
import * as Recharts from "recharts";
import { cn } from "@/lib/utils";

const ChartContext = React.createContext(null);

function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within ChartContainer");
  return ctx;
}

const ChartContainer = React.forwardRef(
  ({ config, className, children, ...props }, ref) => {
    return (
      <ChartContext.Provider value={{ config }}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          <Recharts.ResponsiveContainer>
            {children}
          </Recharts.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  }
);

const ChartTooltip = Recharts.Tooltip;
const ChartLegend = Recharts.Legend;

export { ChartContainer, ChartTooltip, ChartLegend };
