import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, ContactRound, Settings, BarChart3, Calendar, CheckSquare, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Todos", href: "/todos", icon: CheckSquare },
  { name: "Team", href: "/team", icon: Users },
  { name: "Contacts", href: "/contacts", icon: ContactRound },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
  isMobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

const SidebarContent = ({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle?: () => void }) => {
  return (
    <>
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-primary">Buinsoft</h1>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px]",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed && "justify-center"
              )
            }
            title={isCollapsed ? item.name : undefined}
            onClick={() => {
              // Close mobile sidebar when nav item is clicked
              if (onToggle) {
                onToggle();
              }
            }}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export const Sidebar = ({ isCollapsed = false, onToggle, isMobile = false, isMobileOpen = false, onMobileOpenChange }: SidebarProps) => {
  const detectedMobile = useIsMobile();
  const mobile = isMobile !== undefined ? isMobile : detectedMobile;

  if (mobile) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-[18rem] p-0">
          <div className="flex flex-col h-full">
            <SidebarContent isCollapsed={false} onToggle={() => onMobileOpenChange?.(false)} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className={cn(
      "border-r border-border bg-card transition-all duration-300 relative hidden md:block",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <SidebarContent isCollapsed={isCollapsed} onToggle={onToggle} />
    </aside>
  );
};
