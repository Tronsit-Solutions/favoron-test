import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer touch-manipulation tap-highlight-transparent select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground sm:hover:bg-primary/90 active:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground sm:hover:bg-destructive/90 active:bg-destructive/90",
        outline:
          "border border-input bg-background sm:hover:bg-accent sm:hover:text-accent-foreground active:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground sm:hover:bg-secondary/80 active:bg-secondary/80",
        ghost: "sm:hover:bg-accent sm:hover:text-accent-foreground active:bg-accent",
        link: "text-primary underline-offset-4 sm:hover:underline",
        shopper: "bg-logo text-white sm:hover:bg-logo/90 active:bg-logo/90",
        traveler: "bg-traveler text-white sm:hover:bg-traveler/90 active:bg-traveler/90",
        success: "bg-success text-success-foreground sm:hover:bg-success/90 active:bg-success/90",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-[44px]",
        sm: "h-9 rounded-md px-3 min-h-[40px]",
        lg: "h-11 rounded-md px-8 min-h-[48px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
