import { cn } from "@/lib/utils"

/** The shadcn Skeleton, drawn as the design system's shimmer block. */
function Skeleton({
  className,
  ...props
}) {
  return (
    (<div
      aria-hidden
      className={cn("st-skeleton", className)}
      {...props} />)
  );
}

export { Skeleton }
