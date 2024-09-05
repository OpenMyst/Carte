import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * `Card` is a versatile container component with rounded corners, border, and shadow.
 * It is used to group and display content in a styled card layout.
 * 
 * @component
 * @param {Object} props - The properties passed to the card.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @param {React.Ref} ref - Reference to the card element.
 * 
 * @returns {JSX.Element} - The rendered card component.
 */
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border bg-card text-card-foreground shadow-sm m-4", className)}
    {...props} />
))
Card.displayName = "Card"

/**
 * `CardHeader` is a component that represents the header section of a card.
 * It typically contains the card title and description.
 * 
 * @component
 * @param {Object} props - The properties passed to the card header.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @param {React.Ref} ref - Reference to the card header element.
 * 
 * @returns {JSX.Element} - The rendered card header component.
 */
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-1", className)}
    {...props} />
))
CardHeader.displayName = "CardHeader"

/**
 * `CardTitle` is a component that represents the title section of a card header.
 * It is typically styled with a larger font size and bold weight.
 * 
 * @component
 * @param {Object} props - The properties passed to the card title.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @param {React.Ref} ref - Reference to the card title element.
 * 
 * @returns {JSX.Element} - The rendered card title component.
 */
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props} />
))
CardTitle.displayName = "CardTitle"

/**
 * `CardDescription` is a component that represents a descriptive text within a card header.
 * It is typically styled with a smaller font size.
 * 
 * @component
 * @param {Object} props - The properties passed to the card description.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @param {React.Ref} ref - Reference to the card description element.
 * 
 * @returns {JSX.Element} - The rendered card description component.
 */
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm", className)}
    {...props} />
))
CardDescription.displayName = "CardDescription"

/**
 * `CardContent` is a component that represents the main content area of a card.
 * It is typically used to display the primary information or content within the card.
 * 
 * @component
 * @param {Object} props - The properties passed to the card content.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @param {React.Ref} ref - Reference to the card content element.
 * 
 * @returns {JSX.Element} - The rendered card content component.
 */
const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * `CardFooter` is a component that represents the footer section of a card.
 * It typically contains actions or additional information related to the card content.
 * 
 * @component
 * @param {Object} props - The properties passed to the card footer.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @param {React.Ref} ref - Reference to the card footer element.
 * 
 * @returns {JSX.Element} - The rendered card footer component.
 */
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
