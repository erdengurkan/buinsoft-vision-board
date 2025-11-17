import { ActivityLog } from "@/types";
import { format } from "date-fns";
import {
  Plus,
  Edit,
  ArrowRight,
  Trash2,
  Flag,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ActivityTimelineProps {
  logs: ActivityLog[];
}

const getActivityIcon = (actionType: ActivityLog["actionType"]) => {
  switch (actionType) {
    case "project_created":
      return <Plus className="h-4 w-4" />;
    case "project_edited":
      return <Edit className="h-4 w-4" />;
    case "project_status_changed":
      return <ArrowRight className="h-4 w-4" />;
    case "task_created":
      return <Plus className="h-4 w-4" />;
    case "task_edited":
      return <Edit className="h-4 w-4" />;
    case "task_deleted":
      return <Trash2 className="h-4 w-4" />;
    case "task_status_changed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "follow_up_toggled":
      return <Flag className="h-4 w-4" />;
    case "deadline_updated":
      return <Calendar className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getActivityColor = (actionType: ActivityLog["actionType"]) => {
  switch (actionType) {
    case "project_created":
    case "task_created":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "project_edited":
    case "task_edited":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "project_status_changed":
    case "task_status_changed":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "task_deleted":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "follow_up_toggled":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case "deadline_updated":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
};

export const ActivityTimeline = ({ logs }: ActivityTimelineProps) => {
  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Project activity and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show only last 2 items, rest in accordion
  const visibleLogs = logs.slice(0, 2);
  const hiddenLogs = logs.slice(2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Project activity and changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleLogs.map((log, index) => (
            <ActivityItem 
              key={log.id} 
              log={log} 
              isLast={index === visibleLogs.length - 1 && hiddenLogs.length === 0} 
            />
          ))}
          {hiddenLogs.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="more-activities" className="border-none">
                <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
                  Show {hiddenLogs.length} more activity{hiddenLogs.length !== 1 ? "ies" : ""}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {hiddenLogs.map((log, index) => (
                      <ActivityItem 
                        key={log.id} 
                        log={log} 
                        isLast={index === hiddenLogs.length - 1} 
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityItem = ({ log, isLast }: { log: ActivityLog; isLast: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-border" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background",
          getActivityColor(log.actionType)
        )}
      >
        {getActivityIcon(log.actionType)}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{log.description}</p>
            <Badge variant="outline" className="text-xs">
              {log.user}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(log.timestamp, "MMM d, yyyy HH:mm")}
          </span>
        </div>

        {hasMetadata && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {isOpen ? "Hide details" : "Show details"}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1">
                {log.metadata?.oldStatus && log.metadata?.newStatus && (
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <span className="text-muted-foreground">{log.metadata.oldStatus}</span> →{" "}
                    <span>{log.metadata.newStatus}</span>
                  </div>
                )}
                {log.metadata?.field && (
                  <div>
                    <span className="font-medium">{log.metadata.field}:</span>{" "}
                    {log.metadata.oldValue && (
                      <>
                        <span className="text-muted-foreground">{log.metadata.oldValue}</span> →{" "}
                      </>
                    )}
                    <span>{log.metadata.newValue}</span>
                  </div>
                )}
                {log.metadata?.taskId && (
                  <div>
                    <span className="font-medium">Task ID:</span> {log.metadata.taskId}
                  </div>
                )}
                {Object.entries(log.metadata || {})
                  .filter(([key]) => !["oldStatus", "newStatus", "field", "oldValue", "newValue", "taskId"].includes(key))
                  .map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span> {String(value)}
                    </div>
                  ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
};

