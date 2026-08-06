import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-[13px] font-medium tracking-[0.02em] transition-colors duration-100 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-fg hover:bg-primary/85",
        secondary: "bg-bg-elevated text-fg border border-border hover:bg-bg-subtle",
        outline: "border border-border-strong bg-transparent text-fg hover:bg-bg-elevated",
        ghost: "text-fg-muted hover:bg-bg-subtle hover:text-fg",
        danger: "bg-danger text-fg-inverse hover:bg-danger/90",
        accent: "bg-accent text-accent-fg hover:bg-accent/90",
      },
      size: {
        /* min-h on coarse pointers via CSS media in styles.css is hard on cva —
           use min-h that works for both desktop density and mobile thumbs */
        default: "h-10 min-h-10 px-3.5 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:min-h-11",
        sm: "h-9 min-h-9 px-3 text-xs [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:min-h-10",
        lg: "h-11 min-h-11 px-5 text-sm",
        icon: "h-10 w-10 min-h-10 min-w-10 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
export { Button, buttonVariants };
