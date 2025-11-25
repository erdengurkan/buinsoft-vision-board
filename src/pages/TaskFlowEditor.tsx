import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { TaskFlowEditor } from "@/components/flow/TaskFlowEditor";
import { ReactFlowProvider } from "@xyflow/react";
import { Node, Edge } from "@xyflow/react";
import { toast } from "sonner";
import { FlowDiagram } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const TaskFlowEditorPage = () => {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const { projects } = useApp();
  const { logActivity } = useActivityLog();
  const queryClient = useQueryClient();

  // Validate route params
  if (!projectId || !taskId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid route parameters</h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-primary hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const project = projects.find((p) => p.id === projectId);
  const task = project?.tasks.find((t) => t.id === taskId);

  if (!project || !task) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Task not found</h2>
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="text-primary hover:underline"
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<any> }) => {
      return api.patch(`/tasks/${taskId}`, updates);
    },
    onSuccess: (data, variables) => {
      // Optimistic update: preserve task status when updating flowDiagram
      queryClient.setQueryData(["projects"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((p: any) => {
          if (p.id === projectId) {
            return {
              ...p,
              tasks: p.tasks.map((t: any) => {
                if (t.id === variables.taskId) {
                  // Only update flowDiagram, preserve all other fields including status
                  return { ...t, flowDiagram: variables.updates.flowDiagram };
                }
                return t;
              }),
            };
          }
          return p;
        });
      });
      // Then invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleSave = async (nodes: Node[], edges: Edge[], viewport: { x: number; y: number; zoom: number }) => {
    if (!project || !taskId) return;

    const flowDiagram: FlowDiagram = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
      viewport,
    };

    try {
      // Only send flowDiagram, explicitly exclude other fields to prevent status reset
      await updateTaskMutation.mutateAsync({
        taskId,
        updates: { flowDiagram },
      });

      logActivity(
        project.id,
        "task_edited",
        `Flow diagram updated for task "${task.title}"`,
        { taskId: task.id }
      );

      toast.success("Flow diagram saved");
      navigate(`/project/${projectId}`);
    } catch (error) {
      toast.error("Failed to save flow diagram");
    }
  };

  const handleCancel = () => {
    navigate(`/project/${projectId}`);
  };

  // Validate and sanitize nodes/edges from storage - ensure we never pass undefined
  const validateNodes = (nodes: any): Node[] | undefined => {
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) return undefined;
    try {
      const validNodes = nodes.filter((node: any) => 
        node && 
        typeof node === 'object' &&
        typeof node.id === 'string' && 
        node.position && 
        typeof node.position === 'object' &&
        typeof node.position.x === 'number' && 
        typeof node.position.y === 'number' &&
        node.data &&
        typeof node.data === 'object'
      );
      return validNodes.length > 0 ? (validNodes as Node[]) : undefined;
    } catch (error) {
      console.error('Error validating nodes:', error);
      return undefined;
    }
  };

  const validateEdges = (edges: any): Edge[] | undefined => {
    if (!edges || !Array.isArray(edges) || edges.length === 0) return undefined;
    try {
      const validEdges = edges.filter((edge: any) => 
        edge && 
        typeof edge === 'object' &&
        typeof edge.id === 'string' && 
        typeof edge.source === 'string' && 
        typeof edge.target === 'string'
      );
      return validEdges.length > 0 ? (validEdges as Edge[]) : undefined;
    } catch (error) {
      console.error('Error validating edges:', error);
      return undefined;
    }
  };

  const initialNodes = validateNodes(task.flowDiagram?.nodes);
  const initialEdges = validateEdges(task.flowDiagram?.edges);
  const initialViewport = task.flowDiagram?.viewport;

  return (
    <ReactFlowProvider>
      <div className="fixed inset-0 flex flex-col bg-background z-50" style={{ margin: 0, padding: 0 }}>
        <div className="border-b border-border p-4 bg-card flex-shrink-0">
          <h1 className="text-xl font-semibold">
            Flow Diagram: {task.title}
          </h1>
          <p className="text-sm text-muted-foreground">Project: {project.title}</p>
        </div>
        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <TaskFlowEditor
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            initialViewport={initialViewport}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default TaskFlowEditorPage;

