import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2",
      className
    )}
    {...props}
  />
));

export { Input };
