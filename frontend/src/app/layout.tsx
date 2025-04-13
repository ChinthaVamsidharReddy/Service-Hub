import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { metadata } from './metadata';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ["latin"] });

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100 min-h-screen flex flex-col`}>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster 
          position="top-right"
          toastOptions={{
            success: {
              style: {
                background: '#4CAF50',
                color: 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              },
              duration: 4000,
            },
            error: {
              style: {
                background: '#F44336',
                color: 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              },
              duration: 4000,
            },
          }}
        />
      </body>
    </html>
  );
}
