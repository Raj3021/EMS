import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const Command = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn("flex h-full w-full flex-col", className)}
    {...props}
  />
));

const CommandInput = React.forwardRef(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3">
    <Search className="mr-2 h-4 w-4 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn("h-11 w-full bg-transparent outline-none", className)}
      {...props}
    />
  </div>
));

const CommandList = React.forwardRef((props, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className="max-h-[300px] overflow-y-auto"
    {...props}
  />
));

export { Command, CommandInput, CommandList };
