import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-2xl border border-border/60 bg-muted/40 px-3.5 py-2 text-xs font-semibold text-foreground transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-semibold file:text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 shadow-2xs",
        className
      )}
      {...props}
    />
  )
}

export { Input }
