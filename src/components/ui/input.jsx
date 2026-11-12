import * as React from "react"

import { cn } from "@/lib/utils"

/** The shadcn Input, drawn as the design system's field. */
/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn("st-input", className)}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
