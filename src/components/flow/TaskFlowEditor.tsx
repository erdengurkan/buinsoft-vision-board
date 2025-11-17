import { useState, useCallback, useRef, useMemo, useEffect, memo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
  Position,
  MarkerType,
  BackgroundVariant,
} from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { NodePalette } from "./NodePalette";
import { StartNode } from "./nodes/StartNode";
import { ActionNode } from "./nodes/ActionNode";
import { DecisionNode } from "./nodes/DecisionNode";
import { EndNode } from "./nodes/EndNode";
import { CustomEdge } from "./CustomEdges";
import { NodeMenu } from "./NodeMenu";
import {
  Save,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Layout,
  Trash2,
  Copy,
  Plus,
  RotateCcw,
  Maximize,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Loader2 } from "lucide-react";

interface TaskFlowEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  initialViewport?: { x: number; y: number; zoom: number };
  onSave: (nodes: Node[], edges: Edge[], viewport: { x: number; y: number; zoom: number }) => void;
  onCancel: () => void;
}

const nodeTypes = {
  input: StartNode,
  default: ActionNode,
  decision: DecisionNode,
  output: EndNode,
} as any;

const edgeTypes = {
  default: CustomEdge,
};

const defaultNodes: Node[] = [
  {
    id: "start",
    type: "input",
    data: { label: "Start" },
    position: { x: 80, y: 200 },
  },
];

const defaultEdges: Edge[] = [];

// Simple hierarchical layout algorithm
const applyAutoLayout = (nodes: Node[], edges: Edge[]): Node[] => {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const childrenMap = new Map<string, string[]>();
  const levels = new Map<string, number>();

  edges.forEach((edge) => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
  });

  const roots = nodes.filter((n) => !edges.some((e) => e.target === n.id));

  const queue: { id: string; level: number }[] = roots.map((n) => ({ id: n.id, level: 0 }));
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    levels.set(id, level);
    const children = childrenMap.get(id) || [];
    children.forEach((childId) => {
      if (!levels.has(childId)) {
        queue.push({ id: childId, level: level + 1 });
      }
    });
  }

  const levelGroups = new Map<number, Node[]>();
  nodes.forEach((node) => {
    const level = levels.get(node.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });

  const HORIZONTAL_SPACING = 120;
  const VERTICAL_SPACING = 100;
  const START_X = 80;
  const START_Y = 200;

  return nodes.map((node) => {
    const level = levels.get(node.id) || 0;
    const levelNodes = levelGroups.get(level) || [];
    const indexInLevel = levelNodes.findIndex((n) => n.id === node.id);
    const totalInLevel = levelNodes.length;
    const levelWidth = totalInLevel * HORIZONTAL_SPACING;
    const startX = START_X - levelWidth / 2 + HORIZONTAL_SPACING / 2;

    return {
      ...node,
      position: {
        x: startX + indexInLevel * HORIZONTAL_SPACING,
        y: START_Y + level * VERTICAL_SPACING,
      },
    };
  });
};

// Add handle button component
const AddHandleButton = memo(
  ({
    side,
    nodeId,
    onAddNode,
    isVisible,
  }: {
    side: Position;
    nodeId: string;
    onAddNode: (nodeId: string, side: Position, type: string) => void;
    isVisible: boolean;
  }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    if (!isVisible) return null;

    const handleSelect = (type: string) => {
      onAddNode(nodeId, side, type);
      setMenuOpen(false);
    };

    return (
      <NodeMenu open={menuOpen} onOpenChange={setMenuOpen} onSelect={handleSelect} side={side}>
        <button
          className={cn(
            "absolute z-10 w-6 h-6 rounded-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center transition-all shadow-md border-2 border-background",
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
          )}
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
            setMenuOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </NodeMenu>
    );
  }
);

AddHandleButton.displayName = "AddHandleButton";

export const TaskFlowEditor = ({
  initialNodes,
  initialEdges,
  initialViewport,
  onSave,
  onCancel,
}: TaskFlowEditorProps) => {
  // Memoize and validate nodes/edges
  const validInitialNodes = useMemo((): Node[] => {
    try {
      if (initialNodes && Array.isArray(initialNodes) && initialNodes.length > 0) {
        const validNodes = initialNodes.filter(
          (node) =>
            node &&
            typeof node === "object" &&
            typeof node.id === "string" &&
            node.position &&
            typeof node.position.x === "number" &&
            typeof node.position.y === "number" &&
            node.data &&
            typeof node.data === "object"
        );
        return validNodes.length > 0 ? (validNodes as Node[]) : defaultNodes;
      }
    } catch (error) {
      console.error("Error validating nodes:", error);
    }
    return defaultNodes;
  }, [initialNodes]);

  const validInitialEdges = useMemo((): Edge[] => {
    try {
      if (initialEdges && Array.isArray(initialEdges) && initialEdges.length > 0) {
        const validEdges = initialEdges.filter(
          (edge) =>
            edge &&
            typeof edge === "object" &&
            typeof edge.id === "string" &&
            typeof edge.source === "string" &&
            typeof edge.target === "string"
        );
        return validEdges.length > 0
          ? (validEdges.map((e) => ({
              ...e,
              type: e.type || "default",
              markerEnd: e.markerEnd || { type: MarkerType.ArrowClosed },
            })) as Edge[])
          : defaultEdges;
      }
    } catch (error) {
      console.error("Error validating edges:", error);
    }
    return defaultEdges;
  }, [initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(validInitialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(validInitialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Undo/Redo state
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([
    { nodes: validInitialNodes, edges: validInitialEdges },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Auto-save state
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Save to history
  const saveToHistory = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ nodes: newNodes, edges: newEdges });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Handle node changes and save to history (debounced)
  const prevNodesRef = useRef(nodes);
  const prevEdgesRef = useRef(edges);

  useEffect(() => {
    const nodesChanged = JSON.stringify(prevNodesRef.current) !== JSON.stringify(nodes);
    const edgesChanged = JSON.stringify(prevEdgesRef.current) !== JSON.stringify(edges);

    if (nodesChanged || edgesChanged) {
      prevNodesRef.current = nodes;
      prevEdgesRef.current = edges;
      if (history.length > 1 || historyIndex > 0) {
        saveToHistory(nodes, edges);
      }
    }
  }, [nodes, edges, history.length, historyIndex, saveToHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const selectedNodes = nodes.filter((n) => n.selected);
        const selectedEdges = edges.filter((e) => e.selected);
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          e.preventDefault();
          if (selectedNodes.length > 0) {
            const deletedIds = new Set(selectedNodes.map((d) => d.id));
            setNodes((nds) => nds.filter((n) => !deletedIds.has(n.id)));
            setEdges((eds) =>
              eds.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target))
            );
          }
          if (selectedEdges.length > 0) {
            const deletedIds = new Set(selectedEdges.map((d) => d.id));
            setEdges((eds) => eds.filter((e) => !deletedIds.has(e.id)));
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, edges, handleUndo, handleRedo, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "default",
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const deletedIds = new Set(deleted.map((d) => d.id));
      setNodes((nds) => nds.filter((n) => !deletedIds.has(n.id)));
      setEdges((eds) =>
        eds.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target))
      );
    },
    [setNodes, setEdges]
  );

  const onInit = useCallback(
    (instance: any) => {
      setReactFlowInstance(instance);
      if (initialViewport) {
        instance.setViewport({
          x: initialViewport.x,
          y: initialViewport.y,
          zoom: initialViewport.zoom,
        });
      }
      // Do NOT fitView on initial load - start node is at x: 80, y: 200
    },
    [initialViewport]
  );

  // Add node from handle button
  const handleAddNodeFromHandle = useCallback(
    (nodeId: string, side: Position, nodeType: string) => {
      const sourceNode = nodes.find((n) => n.id === nodeId);
      if (!sourceNode || !reactFlowInstance) return;

      const HORIZONTAL_SPACING = 120;
      const VERTICAL_SPACING = 100;
      let newPosition = { ...sourceNode.position };

      // Sabit node boyutları (gerçek render boyutlarına göre)
      const getNodeDimensions = (type: string | undefined) => {
        if (type === "decision") {
          return { width: 120, height: 120 };
        }
        // Start, Action, End: min-w-[140px] + px-5/py-3 padding ≈ 140x60
        return { width: 140, height: 60 };
      };

      const sourceDims = getNodeDimensions(sourceNode.type);
      const newDims = getNodeDimensions(nodeType);

      switch (side) {
        case Position.Top:
          // Üste eklerken: kaynak node'un üstüne, yeni node'un yüksekliği + spacing kadar yukarı
          newPosition.y = sourceNode.position.y - newDims.height - VERTICAL_SPACING;
          newPosition.x = sourceNode.position.x + (sourceDims.width / 2) - (newDims.width / 2);
          break;
        case Position.Bottom:
          // Alta eklerken: kaynak node'un altına, kaynak node'un yüksekliği + spacing kadar aşağı
          newPosition.y = sourceNode.position.y + sourceDims.height + VERTICAL_SPACING;
          newPosition.x = sourceNode.position.x + (sourceDims.width / 2) - (newDims.width / 2);
          break;
        case Position.Left:
          // Sola eklerken: kaynak node'un soluna, yeni node'un genişliği + spacing kadar sola
          newPosition.x = sourceNode.position.x - newDims.width - HORIZONTAL_SPACING;
          newPosition.y = sourceNode.position.y + (sourceDims.height / 2) - (newDims.height / 2);
          break;
        case Position.Right:
          // Sağa eklerken: kaynak node'un sağına, kaynak node'un genişliği + spacing kadar sağa
          newPosition.x = sourceNode.position.x + sourceDims.width + HORIZONTAL_SPACING;
          newPosition.y = sourceNode.position.y + (sourceDims.height / 2) - (newDims.height / 2);
          break;
      }

      const newNode: Node = {
        id: `node-${Date.now()}-${Math.random()}`,
        type: nodeType === "decision" ? "decision" : nodeType,
        position: newPosition,
        data: {
          label:
            nodeType === "input"
              ? "Start"
              : nodeType === "output"
              ? "End"
              : nodeType === "decision"
              ? "Decision"
              : "Action",
        },
      };

      setNodes((nds) => [...nds, newNode]);

      // Correct handle mapping based on side
      const sourceHandleId =
        side === Position.Top
          ? "top-source"
          : side === Position.Bottom
          ? "bottom-source"
          : side === Position.Left
          ? "left-source"
          : "right-source";

      // Target handle is opposite side
      const targetHandleId =
        side === Position.Top
          ? "bottom-target"
          : side === Position.Bottom
          ? "top-target"
          : side === Position.Left
          ? "right-target"
          : "left-target";

      // Default labels for Decision children
      let defaultLabel = "";
      if (sourceNode.type === "decision") {
        if (side === Position.Top || side === Position.Right) {
          defaultLabel = "Yes";
        } else if (side === Position.Bottom || side === Position.Left) {
          defaultLabel = "No";
        }
      }

      const newEdge: Edge = {
        id: `e-${nodeId}-${newNode.id}`,
        source: nodeId,
        target: newNode.id,
        sourceHandle: sourceHandleId,
        targetHandle: targetHandleId,
        type: "default",
        markerEnd: { type: MarkerType.ArrowClosed },
        data: { label: defaultLabel },
      };

      setEdges((eds) => [...eds, newEdge]);
    },
    [nodes, reactFlowInstance, setNodes, setEdges]
  );

  // Update nodes with onAddNode callback and + buttons
  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onAddNode: (side: Position, type: string) =>
            handleAddNodeFromHandle(node.id, side, type),
        },
      })),
    [nodes, handleAddNodeFromHandle]
  );

  const handleAddNode = useCallback(
    (type: string, label: string) => {
      if (!reactFlowInstance) {
        const newNode: Node = {
          id: `node-${Date.now()}-${Math.random()}`,
          type: type === "input" ? "input" : type === "output" ? "output" : type === "decision" ? "decision" : "default",
          position: { x: 250, y: 100 },
          data: { label },
        };
        setNodes((nds) => nds.concat(newNode));
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newNode: Node = {
        id: `node-${Date.now()}-${Math.random()}`,
        type: type === "input" ? "input" : type === "output" ? "output" : type === "decision" ? "decision" : "default",
        position,
        data: { label },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleSave = useCallback(async () => {
    if (!reactFlowInstance || isSaving) return;
    setIsSaving(true);
    try {
      const viewport = reactFlowInstance.getViewport();
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate save delay
      onSave(nodes, edges, { x: viewport.x, y: viewport.y, zoom: viewport.zoom });
      toast.success("Diagram saved");
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, reactFlowInstance, onSave, isSaving]);

  const handleZoomIn = useCallback(() => {
    reactFlowInstance?.zoomIn();
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance?.zoomOut();
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  const handleResetView = useCallback(() => {
    reactFlowInstance?.setViewport({ x: 0, y: 0, zoom: 1 });
  }, [reactFlowInstance]);

  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = applyAutoLayout(nodes, edges);
    setNodes(layoutedNodes);
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.15 });
    }, 100);
  }, [nodes, edges, setNodes, reactFlowInstance]);

  const handleDuplicate = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const newNodes = selectedNodes.map((node) => ({
      ...node,
      id: `node-${Date.now()}-${Math.random()}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      selected: false,
    }));

    setNodes((nds) => [...nds, ...newNodes]);
  }, [nodes, setNodes]);

  const handleDelete = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedEdges = edges.filter((e) => e.selected);
    if (selectedNodes.length > 0) {
      const deletedIds = new Set(selectedNodes.map((d) => d.id));
      setNodes((nds) => nds.filter((n) => !deletedIds.has(n.id)));
      setEdges((eds) =>
        eds.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target))
      );
    }
    if (selectedEdges.length > 0) {
      const deletedIds = new Set(selectedEdges.map((d) => d.id));
      setEdges((eds) => eds.filter((e) => !deletedIds.has(e.id)));
    }
  }, [nodes, edges, setNodes, setEdges]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex h-full w-full">
          {/* Node Palette */}
          <div className="border-r border-border p-4 flex-shrink-0 bg-card/50">
            <NodePalette onAddNode={handleAddNode} />
          </div>

          {/* Flow Canvas */}
          <div className="flex-1 relative overflow-hidden" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodesWithCallbacks}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodesDelete={onNodesDelete}
              onInit={onInit}
              className="bg-muted/20"
              connectionLineStyle={{ strokeWidth: 2 }}
              defaultEdgeOptions={{
                type: "default",
                markerEnd: { type: MarkerType.ArrowClosed },
              }}
              multiSelectionKeyCode={["Meta", "Control"]}
              deleteKeyCode={["Delete", "Backspace"]}
              minZoom={0.5}
              maxZoom={2.0}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={16}
                size={1}
                color="#d1d5db"
              />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  if (node.type === "input") return "#1b5e20";
                  if (node.type === "output") return "#c62828";
                  if (node.type === "decision") return "#f9a825";
                  return "#1565c0";
                }}
                className="bg-card border border-border"
              />
              <Panel position="top-right" className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetView} title="Reset View">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleFitView} title="Fit to Screen">
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleAutoLayout} title="Auto Layout">
                  <Layout className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={historyIndex === history.length - 1}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </Panel>
              <Panel position="bottom-right" className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Back to Task
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Diagram
                    </>
                  )}
                </Button>
              </Panel>
            </ReactFlow>

          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleAddNode.bind(null, "default", "Action")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Node
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDuplicate}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
