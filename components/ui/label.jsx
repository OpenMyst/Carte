"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

/**
 * `labelVariants` defines the CSS variants for the `Label` component.
 * It uses the `class-variance-authority` to manage class names based on variants.
 * 
 * @type {Function} - Function to generate class names based on variant configurations.
 */
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

/**
 * `Label` is a wrapper component for `LabelPrimitive.Root`.
 * It provides additional styling and class name management for label elements.
 * 
 * @component
 * @param {Object} props - The properties passed to the label component.
 * @param {string} [props.className] - Additional CSS class names to apply to the label.
 * @param {React.Ref} ref - Reference to the label element.
 * 
 * @returns {JSX.Element} - The rendered label component.
 */
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
