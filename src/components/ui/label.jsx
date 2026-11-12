import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

/** The shadcn Label, in the design system's label voice. */
/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-[13px] font-semibold leading-none text-fg-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
    {...props} />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
