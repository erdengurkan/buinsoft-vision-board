import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export const AppLayout = () => {
  const { isRunning, activeTimer } = useTaskTimer();
  const { projects } = useApp();
  const task = activeTimer ? projects.find((p) => p.id === activeTimer.projectId)?.tasks.find((t) => t.id === activeTimer.taskId) : null;
  const hasFlowBanner = isRunning && task?.flowDiagram;
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden bg-background",
      isRunning && "pt-[48px]",
      hasFlowBanner && "pt-[64px]"
    )}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
