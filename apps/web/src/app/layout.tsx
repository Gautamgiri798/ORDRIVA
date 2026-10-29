import type { Metadata } from 'next';
import './globals.css';
import { PosStoreProvider } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'ORDRIVA - Restaurant POS & Management System',
  description: 'Enterprise restaurant POS, KDS, inventory, table management and billing.',
  icons: {
    icon: '/ordriva-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col antialiased">
        <PosStoreProvider>
          <Navbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto min-h-0 bg-[#F8FAFC]">
              {children}
            </main>
          </div>
        </PosStoreProvider>
      </body>
    </html>
  );
}
