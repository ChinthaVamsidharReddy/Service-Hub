import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function AuthLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div>
      {children}
      <Toaster 
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: '#4CAF50',
              color: 'white',
            },
          },
          error: {
            style: {
              background: '#F44336',
              color: 'white',
            },
          },
        }}
      />
    </div>
  );
} 