import { Search, User, Settings, LogOut, ChevronDown, ArrowLeft, Users, Calendar as CalendarIcon } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  // Get unique assignees from project tasks
  const assignees = project 
    ? Array.from(new Set([project.assignee, ...project.tasks.map(t => t.assignee)]))
    : [];

  return (
    <header className="flex h-16 items-center border-b border-border bg-card px-6">
      {/* Left: Back Button */}
      {project && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
      
      {/* Center: Project Info (if on project detail page) */}
      {project ? (
        <div 
          className="flex items-center gap-4 flex-1 justify-center min-w-0 px-4 cursor-pointer group"
          onDoubleClick={handleProjectClick}
        >
          {/* Project Title */}
          <Tooltip>
            <TooltipTrigger asChild>
              <h1 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {project.title}
              </h1>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{project.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{project.description || "No description"}</p>
            </TooltipContent>
          </Tooltip>

          <span className="text-muted-foreground">•</span>

          {/* Date Range */}
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

          {/* Priority Badge */}
          <Badge className={cn("text-xs shrink-0 group-hover:shadow-md transition-shadow", 
            project.priority === "Low" ? "bg-priority-low hover:bg-priority-low" :
            project.priority === "Medium" ? "bg-priority-medium hover:bg-priority-medium" :
            project.priority === "High" ? "bg-priority-high hover:bg-priority-high" :
            "bg-red-900 hover:bg-red-900"
          )}>
            {project.priority}
          </Badge>

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

          {/* Labels */}
          {project.labels.length > 0 && (
            <>
              <span className="text-muted-foreground">•</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex gap-1 shrink-0">
                    {project.labels.slice(0, 2).map((label) => (
                      <Badge
                        key={label.id}
                        variant="secondary"
                        className={cn("text-xs px-2 py-0 group-hover:shadow-md transition-shadow", label.color, "text-white")}
                      >
                        {label.name}
                      </Badge>
                    ))}
                    {project.labels.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{project.labels.length - 2}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Labels</p>
                    {project.labels.map(label => (
                      <p key={label.id} className="text-xs text-muted-foreground">• {label.name}</p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex justify-center">
          <h1 className="text-xl font-bold text-foreground">Buinsoft</h1>
        </div>
      )}

      {/* Right: Search and User Menu */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
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
