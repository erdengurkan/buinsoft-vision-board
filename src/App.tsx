import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppProvider } from "./contexts/AppContext";
import { WorkflowProvider } from "./contexts/WorkflowContext";
import { TaskTimerProvider } from "./contexts/TaskTimerContext";
import { TodoProvider } from "./contexts/TodoContext";
import { AppLayout } from "./components/layout/AppLayout";
import { GlobalTimerBar } from "./components/timer/GlobalTimerBar";
import { TimerOutline } from "./components/timer/TimerOutline";
import { cn } from "./lib/utils";
import { useGlobalSSE } from "./hooks/useGlobalSSE";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import Analytics from "./pages/Analytics";
import Calendar from "./pages/Calendar";
import Team from "./pages/Team";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Todos from "./pages/Todos";

// Pre-import @xyflow/react to ensure Vite optimizes it before lazy loading
import "@xyflow/react";

const TaskFlowEditorPage = lazy(() => import("./pages/TaskFlowEditor.tsx"));

const queryClient = new QueryClient();

// Component to initialize global SSE connection
const AppWithSSE = () => {
  // Initialize global SSE connection once for the entire app
  useGlobalSSE();
  
  return (
    <BrowserRouter>
      <TimerOutline>
        <GlobalTimerBar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route
              path="/project/:projectId/task/:taskId/flow"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
                  <TaskFlowEditorPage />
                </Suspense>
              }
            />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/todos" element={<Todos />} />
            <Route path="/team" element={<Team />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/contacts/:id" element={<ContactDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TimerOutline>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <WorkflowProvider>
        <TaskTimerProvider>
          <TodoProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppWithSSE />
            </TooltipProvider>
          </TodoProvider>
        </TaskTimerProvider>
      </WorkflowProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
