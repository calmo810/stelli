import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Minus } from "lucide-react"

import { cn } from "@/lib/utils"

/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
const InputOTP = React.forwardRef(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props} />
))
InputOTP.displayName = "InputOTP"

/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
const InputOTPGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
const InputOTPSlot = React.forwardRef(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    (<div
      ref={ref}
      className={cn(
        "relative mx-[3px] flex h-[54px] w-[42px] items-center justify-center rounded-[14px] bg-[var(--field)] text-[20px] font-bold text-fg shadow-[inset_0_0_0_1px_var(--line)] transition-all sm:w-[46px]",
        isActive && "z-10 shadow-[inset_0_0_0_2px_var(--st-ring)]",
        className
      )}
      {...props}>
      {char}
      {hasFakeCaret && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-pulse bg-[var(--fg)]" />
        </div>
      )}
    </div>)
  );
})
InputOTPSlot.displayName = "InputOTPSlot"

/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
const InputOTPSeparator = React.forwardRef(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
