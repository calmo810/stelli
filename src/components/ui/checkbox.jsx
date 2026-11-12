import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/** The shadcn Checkbox, drawn as the design system's tick box. */
/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] bg-[var(--field)] shadow-[inset_0_0_0_1.5px_var(--line-2)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--st-primary)] data-[state=checked]:text-[var(--st-on-primary)] data-[state=checked]:shadow-none",
      className
    )}
    {...props}>
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-3.5 w-3.5" strokeWidth={3.2} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
