import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NodeMenu } from "../NodeMenu";

interface StartNodeData {
  label: string;
  onAddNode?: (side: Position, type: string) => void;
}

export const StartNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as StartNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(nodeData?.label || "Start");
  const inputRef = useRef<HTMLInputElement>(null);
  const { setNodes } = useReactFlow();

  useEffect(() => {
    setLabel(nodeData?.label || "Start");
  }, [nodeData?.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleLabelSubmit = useCallback(() => {
    if (label.trim() && label !== nodeData?.label) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, label: label.trim() } } : n
        )
      );
    } else {
      setLabel(nodeData?.label || "Start");
    }
    setIsEditing(false);
  }, [label, nodeData?.label, id, setNodes]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleLabelSubmit();
      } else if (e.key === "Escape") {
        setLabel(nodeData?.label || "Start");
        setIsEditing(false);
      }
    },
    [handleLabelSubmit, nodeData?.label]
  );

  const [menuOpen, setMenuOpen] = useState<{ side: Position | null }>({ side: null });

  const handleMenuSelect = useCallback(
    (side: Position, type: string) => {
      if (nodeData?.onAddNode) {
        nodeData.onAddNode(side, type);
      }
      setMenuOpen({ side: null });
    },
    [nodeData?.onAddNode]
  );

  return (
    <div
      className={cn(
        "group relative min-w-[140px] px-5 py-3 bg-[#e8f5e9] border-2 rounded-lg shadow-sm transition-all",
        selected
          ? "border-[#1b5e20] ring-2 ring-[#1b5e20]/20"
          : "border-[#1b5e20]/60"
      )}
      onDoubleClick={() => setIsEditing(true)}
    >
      {isEditing ? (
        <Input
          ref={inputRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleLabelSubmit}
          onKeyDown={handleKeyDown}
          className="h-7 text-base font-semibold text-center border-[#1b5e20] bg-background"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-base font-semibold text-center text-[#1b5e20] break-words">
          {label}
        </span>
      )}

      {/* Handles on all 4 sides - centered */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!bg-[#1b5e20] !border-2 !border-background !w-3 !h-3"
        style={{ top: "-6px", left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!bg-[#1b5e20] !border-2 !border-background !w-3 !h-3"
        style={{ right: "-6px", top: "50%", transform: "translateY(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!bg-[#1b5e20] !border-2 !border-background !w-3 !h-3"
        style={{ bottom: "-6px", left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!bg-[#1b5e20] !border-2 !border-background !w-3 !h-3"
        style={{ left: "-6px", top: "50%", transform: "translateY(-50%)" }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!bg-[#1b5e20] !border-2 !border-background !w-3 !h-3"
        style={{ top: "-6px", left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!bg-[#1b5e20] !border-2 !border-background !w-3 !h-3"
        style={{ right: "-6px", top: "50%", transform: "translateY(-50%)" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!bg-[#1b5e20] !border-2 !border-background !w-3 !h-3"
        style={{ bottom: "-6px", left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!bg-[#1b5e20] !border-2 !border-background !w-3 !h-3"
        style={{ left: "-6px", top: "50%", transform: "translateY(-50%)" }}
      />

      {/* Add buttons on all sides - show when selected */}
      {selected && (
        <>
          {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((side) => (
            <NodeMenu
              key={side}
              open={menuOpen.side === side}
              onOpenChange={(open) => setMenuOpen({ side: open ? side : null })}
              onSelect={(type) => handleMenuSelect(side, type)}
              side={side}
            >
              <button
                className="absolute z-10 w-6 h-6 rounded-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center transition-all shadow-md border-2 border-background"
                style={{
                  [side === Position.Top ? "top" : side === Position.Bottom ? "bottom" : side === Position.Left ? "left" : "right"]:
                    "-12px",
                  [side === Position.Top || side === Position.Bottom ? "left" : "top"]: "50%",
                  transform:
                    side === Position.Top || side === Position.Bottom
                      ? "translateX(-50%)"
                      : "translateY(-50%)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen({ side });
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </NodeMenu>
          ))}
        </>
      )}
    </div>
  );
});

StartNode.displayName = "StartNode";

