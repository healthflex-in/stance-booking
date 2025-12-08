'use client';

import React from 'react';
import { useBackgroundTasks } from '@/contexts';

export const BackgroundTaskIndicator: React.FC = () => {
  const { tasks } = useBackgroundTasks();
  
  // Only show active tasks (pending or processing)
  const activeTasks = tasks.filter(task => 
    task.status === 'pending' || task.status === 'processing'
  );
  
  if (activeTasks.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        {/* <span>
          {activeTasks.length === 1 
            ? activeTasks[0].message 
            : `${activeTasks.length} background tasks running`}
        </span> */}
      </div>
    </div>
  );
};

export default BackgroundTaskIndicator;