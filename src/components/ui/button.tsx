import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[10px] border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:bg-disabled disabled:text-disabled disabled:border-transparent aria-invalid:border-error-solid aria-invalid:ring-3 aria-invalid:ring-error-solid/20 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand-solid text-white hover:bg-brand-solid-hover",
        secondary: "bg-brand-primary text-brand hover:bg-brand-secondary",
        outline: "bg-primary text-secondary border-primary shadow-xs hover:bg-secondary hover:text-primary",
        tertiary: "bg-transparent text-brand hover:bg-brand-primary",
        ghost: "bg-transparent text-tertiary hover:bg-tertiary hover:text-secondary",
        flat: "bg-tertiary text-secondary hover:bg-quaternary hover:text-primary",
        destructive: "bg-error-solid text-white hover:bg-error-solid/90",
        link: "bg-transparent text-brand-secondary hover:text-brand hover:underline p-0 h-auto rounded",
      },
      size: {
        default: "h-10 px-4 text-sm gap-2 [&_svg:not([class*='size-'])]:size-5",
        sm: "h-9 px-3.5 text-sm gap-1.5 [&_svg:not([class*='size-'])]:size-5",
        lg: "h-11 px-[18px] text-base gap-2 [&_svg:not([class*='size-'])]:size-5",
        xl: "h-12 px-5 text-base gap-2.5 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10 p-0 [&_svg:not([class*='size-'])]:size-5",
        "icon-sm": "size-9 p-0 [&_svg:not([class*='size-'])]:size-5",
        "icon-lg": "size-11 p-0 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
