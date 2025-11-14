import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { cn } from "@/lib/utils";

export const AppLayout = () => {
  const { isRunning } = useTaskTimer();

  return (
    <div className={cn("flex h-screen w-full overflow-hidden bg-background", isRunning && "pt-[48px]")}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
