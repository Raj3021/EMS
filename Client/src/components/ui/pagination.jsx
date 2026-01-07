import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const Pagination = ({ className, ...props }) => (
  <nav
    role="navigation"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);

const PaginationItem = ({ className, ...props }) => (
  <li className={cn("", className)} {...props} />
);

const PaginationLink = ({ className, isActive, ...props }) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "h-9 w-9 flex items-center justify-center rounded-md",
      isActive && "border",
      className
    )}
    {...props}
  />
);

const PaginationPrevious = (props) => (
  <PaginationLink {...props}>
    <ChevronLeft className="h-4 w-4" />
  </PaginationLink>
);

const PaginationNext = (props) => (
  <PaginationLink {...props}>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);

const PaginationEllipsis = () => (
  <span className="flex h-9 w-9 items-center justify-center">
    <MoreHorizontal className="h-4 w-4" />
  </span>
);

export {
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
