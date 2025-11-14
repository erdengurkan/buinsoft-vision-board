import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { cn } from "@/lib/utils";

interface TimerOutlineProps {
  children: React.ReactNode;
}

export const TimerOutline = ({ children }: TimerOutlineProps) => {
  const { isRunning } = useTaskTimer();

  return (
    <div className="relative min-h-screen">
      {isRunning && (
        <div
          className="fixed inset-0 pointer-events-none z-40"
          style={{
            boxShadow: "inset 0 0 0 4px rgb(239 68 68)",
          }}
        />
      )}
      {children}
    </div>
  );
};

