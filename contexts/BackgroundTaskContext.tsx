'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface Task {
  id: string;
  type: 'export' | 'import' | 'other';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

interface BackgroundTaskContextType {
  tasks: Task[];
  addTask: (type: Task['type'], message: string) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string, result?: any) => void;
  failTask: (id: string, error: string) => void;
  removeTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;
}

const BackgroundTaskContext = createContext<
  BackgroundTaskContextType | undefined
>(undefined);

export const BackgroundTaskProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const addTask = useCallback((type: Task['type'], message: string): string => {
    const id = `task-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const newTask: Task = {
      id,
      type,
      status: 'pending',
      message,
      startTime: new Date(),
    };

    setTasks((prev) => [...prev, newTask]);
    return id;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const updatedTask = { ...task, ...updates };
          // Show progress toast for processing status
          if (updates.status === 'processing' && updates.message) {
            toast.loading(updates.message, { id: `task-${id}` });
          }
          return updatedTask;
        }
        return task;
      })
    );
  }, []);

  const completeTask = useCallback((id: string, result?: any) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const updatedTask = {
            ...task,
            status: 'completed' as const,
            result,
            endTime: new Date(),
          };

          // Dismiss loading toast and show success
          toast.dismiss(`task-${id}`);
          toast.success(`${task.message} completed`);

          return updatedTask;
        }
        return task;
      })
    );

    // Clean up completed tasks after 1 minute
    setTimeout(() => {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    }, 60000);
  }, []);

  const failTask = useCallback((id: string, error: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const updatedTask = {
            ...task,
            status: 'failed' as const,
            error,
            endTime: new Date(),
          };

          // Dismiss loading toast and show error
          toast.dismiss(`task-${id}`);
          toast.error(`${task.message} failed: ${error}`);

          return updatedTask;
        }
        return task;
      })
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const getTask = useCallback(
    (id: string) => {
      return tasks.find((task) => task.id === id);
    },
    [tasks]
  );

  const value = {
    tasks,
    addTask,
    updateTask,
    completeTask,
    failTask,
    removeTask,
    getTask,
  };

  return (
    <BackgroundTaskContext.Provider value={value}>
      {children}
    </BackgroundTaskContext.Provider>
  );
};

export const useBackgroundTasks = () => {
  const context = useContext(BackgroundTaskContext);
  if (context === undefined) {
    throw new Error(
      'useBackgroundTasks must be used within a BackgroundTaskProvider'
    );
  }
  return context;
};
