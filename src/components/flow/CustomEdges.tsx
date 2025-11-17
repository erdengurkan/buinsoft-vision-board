import { memo, useState, useCallback, useRef, useEffect } from "react";
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, useReactFlow } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  selected,
  data,
  markerEnd,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 20,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState<string>(typeof data?.label === "string" ? data.label : "");
  const inputRef = useRef<HTMLInputElement>(null);
  const { setEdges } = useReactFlow();

  useEffect(() => {
    setLabel(typeof data?.label === "string" ? data.label : "");
  }, [data?.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleLabelSubmit = useCallback(() => {
    const currentLabel = typeof data?.label === "string" ? data.label : "";
    if (typeof label === "string" && label.trim() !== currentLabel) {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id ? { ...edge, data: { ...edge.data, label: label.trim() } } : edge
        )
      );
    }
    setIsEditing(false);
  }, [label, data?.label, id, setEdges]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLabelSubmit();
    } else if (e.key === "Escape") {
      setLabel(typeof data?.label === "string" ? data.label : "");
      setIsEditing(false);
    }
  }, [handleLabelSubmit, data?.label]);

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? "#1976d2" : "#9e9e9e",
        }}
        className={cn("fill-none transition-all cursor-pointer", selected && "drop-shadow-sm")}
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="cursor-pointer"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          {isEditing ? (
            <Input
              ref={inputRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleLabelSubmit}
              onKeyDown={handleKeyDown}
              className="h-7 text-xs px-2 py-1 text-center border-primary bg-white shadow-md rounded"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className={cn(
                "text-xs text-center px-2 py-1 rounded-md bg-white shadow-sm border border-gray-200",
                typeof label === "string" && label ? "text-gray-700" : "text-transparent"
              )}
            >
              {typeof label === "string" ? label : ""}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

CustomEdge.displayName = "CustomEdge";

