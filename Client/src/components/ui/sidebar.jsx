import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeft } from "lucide-react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* -------------------- CONSTANTS -------------------- */

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

/* -------------------- CONTEXT -------------------- */

const SidebarContext = React.createContext(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

/* -------------------- PROVIDER -------------------- */

const SidebarProvider = React.forwardRef(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);
    const [_open, _setOpen] = React.useState(defaultOpen);

    const open = openProp ?? _open;

    const setOpen = React.useCallback(
      (value) => {
        const next = typeof value === "function" ? value(open) : value;
        onOpenChange ? onOpenChange(next) : _setOpen(next);
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${next}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [open, onOpenChange]
    );

    const toggleSidebar = React.useCallback(() => {
      return isMobile ? setOpenMobile((o) => !o) : setOpen((o) => !o);
    }, [isMobile, setOpen]);

    React.useEffect(() => {
      const handler = (e) => {
        if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          toggleSidebar();
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [toggleSidebar]);

    const value = React.useMemo(
      () => ({
        open,
        state: open ? "expanded" : "collapsed",
        isMobile,
        openMobile,
        setOpen,
        setOpenMobile,
        toggleSidebar,
      }),
      [open, isMobile, openMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={value}>
        <TooltipProvider delayDuration={0}>
          <div
            ref={ref}
            style={{
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            }}
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full",
              className
            )}
            {...props}>
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);

SidebarProvider.displayName = "SidebarProvider";

/* -------------------- SIDEBAR -------------------- */

const Sidebar = React.forwardRef(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === "none") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar",
            className
          )}
          {...props}>
          {children}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            side={side}
            className="w-[--sidebar-width] bg-sidebar p-0"
            style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE }}>
            {children}
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-side={side}
        data-variant={variant}
        className={cn("group peer hidden md:block", className)}
        {...props}>
        <div className="fixed inset-y-0 z-10 w-[--sidebar-width] bg-sidebar">
          {children}
        </div>
      </div>
    );
  }
);

Sidebar.displayName = "Sidebar";

/* -------------------- TRIGGER -------------------- */

const SidebarTrigger = React.forwardRef((props, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      {...props}>
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});

SidebarTrigger.displayName = "SidebarTrigger";

/* -------------------- STRUCTURE COMPONENTS -------------------- */

const SidebarContent = React.forwardRef((props, ref) => (
  <div ref={ref} className="flex flex-1 flex-col overflow-auto" {...props} />
));

const SidebarHeader = React.forwardRef((props, ref) => (
  <div ref={ref} className="p-2" {...props} />
));

const SidebarFooter = React.forwardRef((props, ref) => (
  <div ref={ref} className="p-2" {...props} />
));

const SidebarSeparator = React.forwardRef((props, ref) => (
  <Separator ref={ref} className="mx-2 bg-sidebar-border" {...props} />
));

/* -------------------- MENU -------------------- */

const SidebarMenu = React.forwardRef((props, ref) => (
  <ul ref={ref} className="flex flex-col gap-1 p-2" {...props} />
));

const SidebarMenuItem = React.forwardRef((props, ref) => (
  <li ref={ref} {...props} />
));

const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-sidebar-accent",
  {
    variants: {
      size: {
        sm: "h-7 text-xs",
        md: "h-8",
        lg: "h-12",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const SidebarMenuButton = React.forwardRef(
  ({ asChild = false, size, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(sidebarMenuButtonVariants({ size }), className)}
        {...props}
      />
    );
  }
);

SidebarMenuButton.displayName = "SidebarMenuButton";

/* -------------------- SKELETON -------------------- */

const SidebarMenuSkeleton = ({ showIcon }) => (
  <div className="flex items-center gap-2 p-2">
    {showIcon && <Skeleton className="h-4 w-4" />}
    <Skeleton className="h-4 w-full" />
  </div>
);

/* -------------------- EXPORTS -------------------- */

export {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  useSidebar,
};
