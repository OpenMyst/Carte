"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * `Dialog` is the root component for managing dialog state and rendering.
 * It controls the visibility and behavior of the dialog.
 * 
 * @component
 * @returns {JSX.Element} - The rendered dialog component.
 */
const Dialog = DialogPrimitive.Root

/**
 * `DialogTrigger` is the component used to trigger the opening of the dialog.
 * It should be used as the element that initiates the dialog.
 * 
 * @component
 * @returns {JSX.Element} - The rendered dialog trigger component.
 */
const DialogTrigger = DialogPrimitive.Trigger

/**
 * `DialogPortal` is the component used to render the dialog content in a portal.
 * It allows the dialog content to be rendered outside the normal DOM hierarchy.
 * 
 * @component
 * @returns {JSX.Element} - The rendered dialog portal component.
 */
const DialogPortal = DialogPrimitive.Portal

/**
 * `DialogClose` is the component used to close the dialog.
 * It should be used within the dialog content to provide a close button.
 * 
 * @component
 * @returns {JSX.Element} - The rendered dialog close component.
 */
const DialogClose = DialogPrimitive.Close

/**
 * `DialogOverlay` is the component that renders a semi-transparent overlay
 * behind the dialog content to focus attention on the dialog.
 * 
 * @component
 * @param {Object} props - The properties passed to the overlay.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @param {React.Ref} ref - Reference to the overlay element.
 * 
 * @returns {JSX.Element} - The rendered dialog overlay component.
 */
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

/**
 * `DialogContent` is the component that renders the main content of the dialog.
 * It includes the dialog's header, body, and footer.
 * 
 * @component
 * @param {Object} props - The properties passed to the content.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @param {React.Ref} ref - Reference to the dialog content element.
 * @param {React.ReactNode} children - The content to be displayed within the dialog.
 * 
 * @returns {JSX.Element} - The rendered dialog content component.
 */
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}>
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

/**
 * `DialogHeader` is a component for the header section of the dialog.
 * It typically contains the title and description of the dialog.
 * 
 * @component
 * @param {Object} props - The properties passed to the header.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * 
 * @returns {JSX.Element} - The rendered dialog header component.
 */
const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props} />
)
DialogHeader.displayName = "DialogHeader"

/**
 * `DialogFooter` is a component for the footer section of the dialog.
 * It typically contains action buttons or other footer content.
 * 
 * @component
 * @param {Object} props - The properties passed to the footer.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * 
 * @returns {JSX.Element} - The rendered dialog footer component.
 */
const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
DialogFooter.displayName = "DialogFooter"

/**
 * `DialogTitle` is a component for the title of the dialog.
 * It is typically displayed prominently at the top of the dialog content.
 * 
 * @component
 * @param {Object} props - The properties passed to the title.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @param {React.Ref} ref - Reference to the dialog title element.
 * 
 * @returns {JSX.Element} - The rendered dialog title component.
 */
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

/**
 * `DialogDescription` is a component for the description of the dialog.
 * It provides additional information about the dialog's purpose or content.
 * 
 * @component
 * @param {Object} props - The properties passed to the description.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @param {React.Ref} ref - Reference to the dialog description element.
 * 
 * @returns {JSX.Element} - The rendered dialog description component.
 */
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
