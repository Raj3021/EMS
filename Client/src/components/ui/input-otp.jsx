import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";
import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef(
  ({ className, containerClassName, ...props }, ref) => (
    <OTPInput
      ref={ref}
      className={cn("disabled:opacity-50", className)}
      containerClassName={cn("flex gap-2", containerClassName)}
      {...props}
    />
  )
);

const InputOTPSlot = React.forwardRef(({ index, className, ...props }, ref) => {
  const { slots } = React.useContext(OTPInputContext);
  const { char, isActive } = slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        "h-10 w-10 border flex items-center justify-center",
        isActive && "ring-2",
        className
      )}
      {...props}>
      {char}
    </div>
  );
});

const InputOTPSeparator = () => <Dot />;

export { InputOTP, InputOTPSlot, InputOTPSeparator };
