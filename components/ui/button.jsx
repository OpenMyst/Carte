import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

/**
 * `buttonVariants` defines various style variants for the `Button` component.
 * This utility function uses `class-variance-authority` to manage different
 * button styles based on variant and size props.
 * 
 * @constant
 * @type {Function}
 * @param {string} base - The base class for button styling.
 * @param {Object} options - Variants and default styles.
 * @param {Object} options.variants - Variants for button styles.
 * @param {Object} options.defaultVariants - Default variant and size.
 * 
 * @returns {string} - The computed class names based on provided variants and size.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-black border-2 bg-background hover:bg-accent hover:text-accent-foreground m-2",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * `Button` is a versatile button component that supports different styles and sizes.
 * It uses the `buttonVariants` utility to apply appropriate styles based on the 
 * `variant` and `size` props. The component can also render as different elements
 * based on the `asChild` prop.
 * 
 * @component
 * @param {Object} props - The properties passed to the button.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @param {string} [props.variant] - Style variant of the button (default, destructive, outline, etc.).
 * @param {string} [props.size] - Size of the button (default, sm, lg, icon).
 * @param {boolean} [props.asChild=false] - If true, the button will render as a `Slot` component instead of a `button`.
 * @param {React.Ref} ref - Reference to the button element.
 * 
 * @returns {JSX.Element} - The rendered button component.
 */
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
