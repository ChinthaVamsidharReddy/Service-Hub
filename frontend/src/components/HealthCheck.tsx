'use client';

import { useEffect, useState } from 'react';
import { checkBackendHealth } from '@/utils/healthCheck';

export default function HealthCheck() {
  const [backendStatus, setBackendStatus] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const result = await checkBackendHealth();
        setBackendStatus(result.status === 'healthy' ? 'healthy' : 'unhealthy');
      } catch (error) {
        setBackendStatus('unhealthy');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (backendStatus === 'unhealthy') {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Warning!</strong>
        <span className="block sm:inline"> Backend service is currently unavailable. Some features may not work.</span>
      </div>
    );
  }

  return null;
} 