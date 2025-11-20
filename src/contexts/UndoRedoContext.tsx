import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Task, Project } from '@/types';

// Action types for undo/redo
export type UndoableAction = 
  | { type: 'TASK_CREATE'; task: Task; projectId: string }
  | { type: 'TASK_UPDATE'; taskId: string; projectId: string; before: Partial<Task>; after: Partial<Task> }
  | { type: 'TASK_DELETE'; task: Task; projectId: string }
  | { type: 'TASK_REORDER'; projectId: string; taskOrders: Array<{ id: string; order: number; status: string }>; previousOrders: Array<{ id: string; order: number; status: string }> }
  | { type: 'STATUS_CREATE'; status: { id: string; name: string; color: string; order: number } }
  | { type: 'STATUS_UPDATE'; statusId: string; statusName: string; before: { name: string; color: string }; after: { name: string; color: string } }
  | { type: 'STATUS_DELETE'; status: { id: string; name: string; color: string; order: number } };

interface UndoRedoContextType {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  addAction: (action: UndoableAction) => void;
  clearHistory: () => void;
  historySize: number;
}

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined);

const MAX_HISTORY_SIZE = 50;

interface UndoRedoProviderProps {
  children: ReactNode;
  onUndo: (action: UndoableAction) => Promise<void>;
  onRedo: (action: UndoableAction) => Promise<void>;
}

export const UndoRedoProvider = ({ children, onUndo, onRedo }: UndoRedoProviderProps) => {
  const [undoStack, setUndoStack] = useState<UndoableAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoableAction[]>([]);

  const addAction = useCallback((action: UndoableAction) => {
    setUndoStack((prev) => {
      const newStack = [...prev, action];
      // Limit history size
      if (newStack.length > MAX_HISTORY_SIZE) {
        return newStack.slice(newStack.length - MAX_HISTORY_SIZE);
      }
      return newStack;
    });
    // Clear redo stack when new action is added
    setRedoStack([]);
  }, []);

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, action]);

    try {
      await onUndo(action);
    } catch (error) {
      console.error('Undo failed:', error);
      // Revert the stack changes on error
      setUndoStack((prev) => [...prev, action]);
      setRedoStack((prev) => prev.slice(0, -1));
    }
  }, [undoStack, onUndo]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, action]);

    try {
      await onRedo(action);
    } catch (error) {
      console.error('Redo failed:', error);
      // Revert the stack changes on error
      setRedoStack((prev) => [...prev, action]);
      setUndoStack((prev) => prev.slice(0, -1));
    }
  }, [redoStack, onRedo]);

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Shift+Z or Ctrl+Y or Cmd+Shift+Z or Cmd+Y for redo
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <UndoRedoContext.Provider
      value={{
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        undo,
        redo,
        addAction,
        clearHistory,
        historySize: undoStack.length,
      }}
    >
      {children}
    </UndoRedoContext.Provider>
  );
};

export const useUndoRedo = () => {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error('useUndoRedo must be used within UndoRedoProvider');
  }
  return context;
};

