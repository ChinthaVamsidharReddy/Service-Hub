'use client';

import { usePathname } from 'next/navigation';
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  return (
    <>
      {!isAuthPage && <Header />}
      <main className={`flex-grow ${!isAuthPage ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : ''}`}>
        {children}
      </main>
      {!isAuthPage && <Footer />}
    </>
  );
} 