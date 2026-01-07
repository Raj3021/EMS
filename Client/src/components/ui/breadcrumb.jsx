import * as React from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const Breadcrumb = React.forwardRef((props, ref) => (
  <nav ref={ref} aria-label="breadcrumb" {...props} />
));

const BreadcrumbList = React.forwardRef(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn("flex items-center gap-2 text-sm", className)}
    {...props}
  />
));

const BreadcrumbItem = React.forwardRef((props, ref) => (
  <li ref={ref} {...props} />
));

const BreadcrumbSeparator = () => <ChevronRight className="h-4 w-4" />;

const BreadcrumbEllipsis = () => <MoreHorizontal className="h-4 w-4" />;

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
