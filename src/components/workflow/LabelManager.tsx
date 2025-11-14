import { useState } from "react";
import { Label } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label as FormLabel } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LabelManagerProps {
  labels: Label[];
  onAdd: (label: Omit<Label, "id">) => void;
  onUpdate: (id: string, updates: Partial<Label>) => void;
  onDelete: (id: string) => void;
}

const colorOptions = [
  { name: "Blue", value: "bg-blue-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Red", value: "bg-red-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Cyan", value: "bg-cyan-500" },
];

export const LabelManager = ({ labels, onAdd, onUpdate, onDelete }: LabelManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("bg-blue-500");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleAdd = () => {
    if (newLabelName.trim()) {
      onAdd({ name: newLabelName, color: newLabelColor });
      setNewLabelName("");
      setNewLabelColor("bg-blue-500");
      setIsAdding(false);
    }
  };

  const handleEdit = (label: Label) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const handleSave = () => {
    if (editingId && editName.trim()) {
      onUpdate(editingId, { name: editName, color: editColor });
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Label Manager</CardTitle>
        <CardDescription>Create and manage custom labels for projects and tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {labels.map((label) => (
            <div key={label.id} className="flex items-center gap-2">
              {editingId === label.id ? (
                <div className="flex items-center gap-2 p-2 border border-border rounded-lg bg-muted/50">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-32"
                    placeholder="Label name"
                  />
                  <div className="flex gap-1">
                    {colorOptions.slice(0, 5).map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setEditColor(color.value)}
                        className={cn(
                          "w-5 h-5 rounded-full border-2",
                          color.value,
                          editColor === color.value ? "border-primary ring-1 ring-primary" : "border-transparent"
                        )}
                      />
                    ))}
                  </div>
                  <Button size="icon" variant="ghost" onClick={handleSave} className="h-7 w-7">
                    <Check className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleCancel} className="h-7 w-7">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <Badge className={cn(label.color, "text-white group")}>
                  {label.name}
                  <div className="ml-2 opacity-0 group-hover:opacity-100 inline-flex gap-1">
                    <button onClick={() => handleEdit(label)} className="hover:text-primary">
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button onClick={() => onDelete(label.id)} className="hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </Badge>
              )}
            </div>
          ))}
        </div>

        {isAdding ? (
          <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <FormLabel>Label Name</FormLabel>
              <Input
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Enter label name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <FormLabel>Color</FormLabel>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewLabelColor(color.value)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2",
                      color.value,
                      newLabelColor === color.value ? "border-primary ring-2 ring-primary" : "border-transparent"
                    )}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)} size="sm">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsAdding(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Label
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
