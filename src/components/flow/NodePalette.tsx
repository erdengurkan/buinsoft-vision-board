import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, GitBranch, Circle } from "lucide-react";

interface NodePaletteProps {
  onAddNode: (type: string, label: string) => void;
}

const nodeTypes = [
  { type: "input", label: "Start", icon: Play, color: "bg-green-500", hoverColor: "hover:bg-green-600" },
  { type: "default", label: "Action", icon: Square, color: "bg-blue-500", hoverColor: "hover:bg-blue-600" },
  { type: "decision", label: "Decision", icon: GitBranch, color: "bg-yellow-500", hoverColor: "hover:bg-yellow-600" },
  { type: "output", label: "End", icon: Circle, color: "bg-red-500", hoverColor: "hover:bg-red-600" },
];

export const NodePalette = ({ onAddNode }: NodePaletteProps) => {
  return (
    <Card className="w-52 shadow-sm">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-sm font-semibold">Node Types</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {nodeTypes.map((nodeType) => {
          const Icon = nodeType.icon;
          return (
            <Button
              key={nodeType.label}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-2.5 px-3 hover:bg-muted/50 transition-colors"
              onClick={() => onAddNode(nodeType.type, nodeType.label)}
            >
              <div className={`w-4 h-4 rounded ${nodeType.color} ${nodeType.hoverColor} transition-colors shadow-sm`} />
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{nodeType.label}</span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
