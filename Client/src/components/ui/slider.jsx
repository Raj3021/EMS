import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full items-center", className)}
    {...props}>
    <SliderPrimitive.Track className="h-2 w-full rounded-full bg-secondary">
      <SliderPrimitive.Range className="h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="h-5 w-5 rounded-full border bg-background" />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";

export { Slider };
