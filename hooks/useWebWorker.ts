'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useBackgroundTasks } from '@/contexts';

export const useWebWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const { updateTask, completeTask, failTask } = useBackgroundTasks();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker('/workers/export-worker.js');
      
      workerRef.current.onmessage = (e) => {
        const { type, taskId, result, error, message } = e.data;
        
        switch (type) {
          case 'EXPORT_PROGRESS':
            updateTask(taskId, { status: 'processing', message });
            break;
          case 'EXPORT_SUCCESS':
            completeTask(taskId, result);
            // Auto-download the file
            if (result?.url) {
              const link = document.createElement('a');
              link.href = result.url;
              link.download = result.filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
            break;
          case 'EXPORT_ERROR':
            failTask(taskId, error);
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
      };
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [updateTask, completeTask, failTask]);

  const exportInvoices = useCallback((taskId: string, invoiceIds: string[]) => {
    if (workerRef.current) {
      const token = localStorage.getItem('token') || '';
      const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_API_URL || 'https://devapi.stance.health/graphql';
      
      workerRef.current.postMessage({
        type: 'EXPORT_INVOICES',
        taskId,
        data: {
          invoiceIds,
          token,
          graphqlEndpoint
        }
      });
    }
  }, []);

  const exportAdvances = useCallback((taskId: string, advanceIds: string[]) => {
    if (workerRef.current) {
      const token = localStorage.getItem('token') || '';
      const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_API_URL || 'https://devapi.stance.health/graphql';
      
      workerRef.current.postMessage({
        type: 'EXPORT_ADVANCES',
        taskId,
        data: {
          advanceIds,
          token,
          graphqlEndpoint
        }
      });
    }
  }, []);

  return { exportInvoices, exportAdvances };
};