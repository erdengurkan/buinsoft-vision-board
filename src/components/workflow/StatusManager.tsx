import { useState } from "react";
import { StatusColumn } from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit2, GripVertical, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface StatusManagerProps {
  title: string;
  description: string;
  statuses: StatusColumn[];
  onAdd: (status: Omit<StatusColumn, "id" | "order">) => void;
  onUpdate: (id: string, updates: Partial<StatusColumn>) => void;
  onDelete: (id: string) => void;
  onReorder: (statuses: StatusColumn[]) => void;
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

const SortableStatusItem = ({
  status,
  onUpdate,
  onDelete,
}: {
  status: StatusColumn;
  onUpdate: (id: string, updates: Partial<StatusColumn>) => void;
  onDelete: (id: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(status.name);
  const [editColor, setEditColor] = useState(status.color);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    onUpdate(status.id, { name: editName, color: editColor });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(status.name);
    setEditColor(status.color);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-card border border-border rounded-lg",
        isDragging && "opacity-50"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {isEditing ? (
        <>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1"
            placeholder="Status name"
          />
          <div className="flex gap-1 flex-wrap">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setEditColor(color.value)}
                className={cn(
                  "w-6 h-6 rounded-full border-2",
                  color.value,
                  editColor === color.value ? "border-primary ring-2 ring-primary" : "border-transparent"
                )}
              />
            ))}
          </div>
          <Button size="icon" variant="ghost" onClick={handleSave}>
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCancel}>
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </>
      ) : (
        <>
          <Badge className={cn(editColor, "text-white flex-1")}>{status.name}</Badge>
          <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(status.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </>
      )}
    </div>
  );
};

export const StatusManager = ({
  title,
  description,
  statuses,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}: StatusManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("bg-blue-500");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleAdd = () => {
    if (newStatusName.trim()) {
      onAdd({ name: newStatusName, color: newStatusColor });
      setNewStatusName("");
      setNewStatusColor("bg-blue-500");
      setIsAdding(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = statuses.findIndex((s) => s.id === active.id);
      const newIndex = statuses.findIndex((s) => s.id === over.id);

      const newStatuses = [...statuses];
      const [removed] = newStatuses.splice(oldIndex, 1);
      newStatuses.splice(newIndex, 0, removed);

      onReorder(newStatuses);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={statuses.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {statuses.map((status) => (
              <SortableStatusItem
                key={status.id}
                status={status}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </SortableContext>
        </DndContext>

        {isAdding ? (
          <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label>Status Name</Label>
              <Input
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="Enter status name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewStatusColor(color.value)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2",
                      color.value,
                      newStatusColor === color.value ? "border-primary ring-2 ring-primary" : "border-transparent"
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
            Add Status
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
