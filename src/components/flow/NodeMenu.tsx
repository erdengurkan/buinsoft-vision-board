import { memo } from "react";
import { Position } from "@xyflow/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Play, Square, GitBranch, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: string) => void;
  side: Position;
  children: React.ReactNode;
}

const nodeTypes = [
  { type: "input", label: "Start", icon: Play, color: "bg-[#1b5e20]" },
  { type: "default", label: "Action", icon: Square, color: "bg-[#1565c0]" },
  { type: "decision", label: "Decision", icon: GitBranch, color: "bg-[#f9a825]" },
  { type: "output", label: "End", icon: Circle, color: "bg-[#c62828]" },
];

export const NodeMenu = memo(({ open, onOpenChange, onSelect, side, children }: NodeMenuProps) => {
  const handleSelect = (type: string) => {
    onSelect(type);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" onInteractOutside={(e) => {
        // Keep open until user selects
        e.preventDefault();
      }}>
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Select next step</div>
          {nodeTypes.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <button
                key={nodeType.type}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                onClick={() => handleSelect(nodeType.type)}
              >
                <div className={cn("w-2.5 h-2.5 rounded", nodeType.color)} />
                <Icon className="h-4 w-4" />
                <span className="font-medium">{nodeType.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
});

NodeMenu.displayName = "NodeMenu";

