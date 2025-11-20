import { Search, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getDeadlineStatus, hasFollowUpNeeded } from "@/utils/deadlineHelpers";
import { ProjectFormModal } from "@/components/modals/ProjectFormModal";
import { Project } from "@/types";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, updateProject } = useApp();
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

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Left: Project Info (if on project detail page) or empty */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {project ? (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleProjectClick}>
              <h1 className="text-base font-bold text-foreground truncate">
                {project.title}
              </h1>
              <span className="text-muted-foreground text-xs">•</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <User className="h-3 w-3" />
                <span className="truncate">{project.assignee}</span>
              </div>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-xs text-muted-foreground truncate">{project.client}</span>
              <span className="text-muted-foreground text-xs">•</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Calendar className="h-3 w-3" />
                <span className="truncate">
                  {format(project.startDate, "MMM d")} - {format(project.endDate, "MMM d")}
                </span>
              </div>
              {project.deadline && (
                <>
                  <span className="text-muted-foreground text-xs">•</span>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium shrink-0",
                    deadlineStatus === "overdue" ? "text-red-600 dark:text-red-400" :
                      deadlineStatus === "soon" ? "text-orange-600 dark:text-orange-400" :
                        "text-muted-foreground"
                  )}>
                    <Calendar className="h-3 w-3" />
                    <span>{format(project.deadline, "MMM d")}</span>
                  </div>
                </>
              )}
              {needsFollowUp && (
                <>
                  <span className="text-muted-foreground text-xs">•</span>
                  <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium shrink-0">
                    <AlertCircle className="h-3 w-3" />
                    <span>Follow-up</span>
                  </div>
                </>
              )}
              {project.labels.length > 0 && (
                <>
                  <span className="text-muted-foreground text-xs">•</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {project.labels.slice(0, 2).map((label) => (
                      <Badge
                        key={label.id}
                        variant="secondary"
                        className={cn("text-xs px-1 py-0", label.color, "text-white")}
                      >
                        {label.name}
                      </Badge>
                    ))}
                    {project.labels.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{project.labels.length - 2}</span>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={cn("text-xs px-2 py-0", 
                project.priority === "Low" ? "bg-priority-low text-white" :
                project.priority === "Medium" ? "bg-priority-medium text-white" :
                project.priority === "High" ? "bg-priority-high text-white" :
                "bg-red-900 text-white"
              )}>
                {project.priority}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0">
                {project.status}
              </Badge>
            </div>
          </>
        ) : null}
      </div>

      {/* Right: Search and User Menu */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Search - Icon only, expands on click */}
        {isSearchOpen ? (
          <div className="relative w-64">
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
            className="h-8 w-8 p-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  U
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
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
