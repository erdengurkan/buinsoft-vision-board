import { Search, User, Settings, LogOut, ChevronDown, ArrowLeft, Users, Calendar as CalendarIcon, Clock, AlertTriangle, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getDeadlineStatus, hasFollowUpNeeded } from "@/utils/deadlineHelpers";
import { ProjectFormModal } from "@/components/modals/ProjectFormModal";
import { Project } from "@/types";
import { APP_VERSION } from "@/config/version";

interface HeaderProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export const Header = ({ onMenuClick, isMobile: isMobileProp }: HeaderProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, updateProject } = useApp();
  const { user } = useAuth();
  const detectedMobile = useIsMobile();
  const isMobile = isMobileProp !== undefined ? isMobileProp : detectedMobile;
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Check if we're on a project detail page
  const projectId = location.pathname.match(/\/project\/([^/]+)/)?.[1];
  const project = projectId ? projects.find((p) => p.id === projectId) : null;
  const deadlineStatus = project?.deadline ? getDeadlineStatus(project.deadline) : null;
  const needsFollowUp = project ? hasFollowUpNeeded(project.tasks) : false;

  const handleLogout = () => {
    navigate("/");
  };

  const handleProjectClick = () => {
    if (project) {
      setIsProjectModalOpen(true);
    }
  };

  const handleSaveProject = (projectData: Partial<Project>) => {
    if (project) {
      updateProject(project.id, projectData);
    }
  };

  // Get unique assignees from project tasks
  const assignees = project 
    ? Array.from(new Set([project.assignee, ...project.tasks.map(t => t.assignee)]))
    : [];

  return (
    <header className="flex h-16 items-center border-b border-border bg-card px-3 sm:px-6 gap-2">
      {/* Left: Menu Button (Mobile) or Back Button */}
      {isMobile && onMenuClick ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="shrink-0 h-10 w-10 p-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
      ) : project ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="shrink-0 h-10 w-10 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      ) : null}
      
      {/* Center: Project Info (if on project detail page) */}
      {project ? (
        <div 
          className={cn(
            "flex items-center flex-1 justify-center min-w-0 cursor-pointer group",
            isMobile ? "gap-2 px-2" : "gap-4 px-4"
          )}
          onDoubleClick={handleProjectClick}
        >
          {/* Project Title */}
          <Tooltip>
            <TooltipTrigger asChild>
              <h1 className={cn(
                "font-bold text-foreground truncate group-hover:text-primary transition-colors",
                isMobile ? "text-sm" : "text-lg"
              )}>
                {project.title}
              </h1>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{project.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{project.description || "No description"}</p>
            </TooltipContent>
          </Tooltip>

          {!isMobile && <span className="text-muted-foreground">•</span>}

          {/* Date Range - Hidden on mobile */}
          {!isMobile && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>{format(project.startDate, "MMM d")} - {format(project.endDate, "MMM d")}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Start: {format(project.startDate, "PPP")}</p>
                  <p className="text-xs">End: {format(project.endDate, "PPP")}</p>
                  {project.deadline && (
                    <p className="text-xs text-orange-500 mt-1">Deadline: {format(project.deadline, "PPP")}</p>
                  )}
                </TooltipContent>
              </Tooltip>

              {/* Deadline - If exists */}
              {project.deadline && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-semibold shrink-0 group-hover:shadow-lg transition-all",
                          deadlineStatus === "overdue" 
                            ? "bg-red-500/90 border-red-600 text-white hover:bg-red-600" 
                            : deadlineStatus === "soon" 
                              ? "bg-orange-500/90 border-orange-600 text-white hover:bg-orange-600 animate-pulse"
                              : "bg-green-600 border-green-700 text-white hover:bg-green-700"
                        )}
                      >
                        {deadlineStatus === "overdue" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : deadlineStatus === "soon" ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <CalendarIcon className="h-3 w-3" />
                        )}
                        <span className="font-semibold">
                          {deadlineStatus === "overdue" ? "Overdue" : deadlineStatus === "soon" ? "Due Soon" : "On Track"}
                        </span>
                        <span className="opacity-75">•</span>
                        <span>{format(project.deadline, "MMM d")}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="text-xs font-medium">
                          {deadlineStatus === "overdue" 
                            ? "⚠️ Deadline Passed" 
                            : deadlineStatus === "soon" 
                              ? "⏰ Deadline Approaching" 
                              : "✅ Deadline OK"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(project.deadline, "EEEE, MMMM d, yyyy")}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </>
          )}

          {!isMobile && (
            <>
              <span className="text-muted-foreground">•</span>

              {/* Assignees - Avatar Group */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center -space-x-2 shrink-0">
                    {assignees.slice(0, 3).map((assignee, idx) => (
                      <Avatar 
                        key={assignee} 
                        className="h-7 w-7 border-2 border-background ring-1 ring-border hover:z-10 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                          {assignee.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {assignees.length > 3 && (
                      <div className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground ring-1 ring-border hover:z-10 hover:scale-110 transition-transform cursor-pointer">
                        +{assignees.length - 3}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="text-xs font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Team Members
                    </p>
                    {assignees.map(assignee => (
                      <p key={assignee} className="text-xs text-muted-foreground">• {assignee}</p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>

              <span className="text-muted-foreground">•</span>

              {/* Status Badge */}
              <Badge 
                variant="outline" 
                className={cn("text-xs shrink-0 group-hover:shadow-md transition-shadow",
                  project.status === "Done" && "bg-green-900/20 border-green-900/50 text-green-100",
                  project.status === "Active" && "bg-green-600 border-green-600 text-white",
                  project.status === "Potential" && "bg-gray-900/20 border-gray-900/50 text-gray-100",
                  project.status === "On Hold" && "bg-orange-900/20 border-orange-900/50 text-orange-100"
                )}
              >
                {project.status}
              </Badge>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex justify-center">
          <h1 className={cn("font-bold text-foreground", isMobile ? "text-sm" : "text-xl")}>Buinsoft</h1>
        </div>
      )}

      {/* Right: Search and User Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
        {/* Version Number - Hidden on mobile */}
        {!isMobile && (
          <span className="text-xs font-semibold text-primary font-mono bg-primary/10 px-2 py-1 rounded">v{APP_VERSION}</span>
        )}
        
        {/* Search - Icon only, expands on click */}
        {isSearchOpen ? (
          <div className={cn("relative", isMobile ? "w-40" : "w-64")}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects, tasks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery.trim()) {
                  setIsSearchOpen(false);
                }
              }}
              autoFocus
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className={cn("p-0", isMobile ? "h-10 w-10" : "h-8 w-8")}
          >
            <Search className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
          </Button>
        )}

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn("relative rounded-full p-0", isMobile ? "h-10 w-10" : "h-8 w-8")}>
              <Avatar className={cn("cursor-pointer", isMobile ? "h-10 w-10" : "h-8 w-8")}>
                <AvatarFallback className={cn("bg-primary text-primary-foreground", isMobile ? "text-base" : "text-sm")}>
                  U
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            {user && (
              <>
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{user.name || "User"}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Project Edit Modal */}
      {project && (
        <ProjectFormModal
          open={isProjectModalOpen}
          onOpenChange={setIsProjectModalOpen}
          project={project}
          onSave={handleSaveProject}
        />
      )}
    </header>
  );
};
