import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

/** The shadcn Tabs, drawn as the design system's segmented control. */
const Tabs = TabsPrimitive.Root

/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("st-seg no-scrollbar overflow-x-auto", className)}
    {...props} />
))
TabsList.displayName = TabsPrimitive.List.displayName

/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn("disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[var(--st-primary)] data-[state=active]:text-[var(--st-on-primary)]", className)}
    {...props} />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-4", className)}
    {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
