import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { StatusManager } from "@/components/workflow/StatusManager";
import { LabelManager } from "@/components/workflow/LabelManager";

const Settings = () => {
  const {
    projectStatuses,
    taskStatuses,
    labels,
    addProjectStatus,
    updateProjectStatus,
    deleteProjectStatus,
    reorderProjectStatuses,
    addTaskStatus,
    updateTaskStatus,
    deleteTaskStatus,
    reorderTaskStatuses,
    addLabel,
    updateLabel,
    deleteLabel,
  } = useWorkflow();

  return (
    <div className="px-4 md:px-6 py-4 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and workflow preferences
        </p>
      </div>

      <Tabs defaultValue="workflow" className="w-full">
        <TabsList>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-6 mt-6">
          <StatusManager
            title="Project Status Columns"
            description="Customize the status columns for your project board"
            statuses={projectStatuses}
            onAdd={addProjectStatus}
            onUpdate={updateProjectStatus}
            onDelete={deleteProjectStatus}
            onReorder={reorderProjectStatuses}
          />

          <StatusManager
            title="Task Status Stages"
            description="Customize the status stages for task boards within projects"
            statuses={taskStatuses}
            onAdd={addTaskStatus}
            onUpdate={updateTaskStatus}
            onDelete={deleteTaskStatus}
            onReorder={reorderTaskStatuses}
          />

          <LabelManager
            labels={labels}
            onAdd={addLabel}
            onUpdate={updateLabel}
            onDelete={deleteLabel}
          />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your name" defaultValue="Demo User" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@buinsoft.com"
                  defaultValue="demo@buinsoft.com"
                />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the platform looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your projects
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Task Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when tasks are updated
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Project Deadlines</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders about upcoming deadlines
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
