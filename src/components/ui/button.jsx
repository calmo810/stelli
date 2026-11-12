import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

/**
 * The shadcn Button, drawn with the Stelli design system (src/styles/system.css).
 * Same props as before; the look is the system's pill button on whichever
 * surface it sits on.
 */
const buttonVariants = cva(
  "st-btn [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "st-btn--primary",
        destructive: "st-btn--danger",
        outline: "st-btn--outline",
        secondary: "st-btn--soft",
        ghost: "st-btn--ghost",
        link: "st-btn--ghost !min-h-0 !p-0 underline-offset-4 hover:underline",
      },
      size: {
        default: "",
        sm: "st-btn--sm",
        lg: "st-btn--lg",
        icon: "!w-12 !p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
