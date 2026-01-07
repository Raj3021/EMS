import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const Menubar = React.forwardRef(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border p-1",
      className
    )}
    {...props}
  />
));
Menubar.displayName = "Menubar";

const MenubarTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn("px-3 py-1.5 text-sm font-medium", className)}
    {...props}
  />
));
MenubarTrigger.displayName = "MenubarTrigger";

const MenubarContent = React.forwardRef(({ className, ...props }, ref) => (
  <MenubarPrimitive.Content
    ref={ref}
    className={cn(
      "z-50 min-w-[12rem] rounded-md border bg-popover p-1 shadow-md",
      className
    )}
    {...props}
  />
));
MenubarContent.displayName = "MenubarContent";

const MenubarItem = React.forwardRef(({ className, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn("px-2 py-1.5 text-sm rounded-sm", className)}
    {...props}
  />
));
MenubarItem.displayName = "MenubarItem";

export { Menubar, MenubarTrigger, MenubarContent, MenubarItem };
