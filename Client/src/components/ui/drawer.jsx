import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

const Drawer = (props) => <DrawerPrimitive.Root {...props} />;
const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className="fixed inset-0 bg-black/50" />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed bottom-0 inset-x-0 rounded-t-lg bg-background p-4",
          className
        )}
        {...props}>
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  )
);

export { Drawer, DrawerTrigger, DrawerContent };
