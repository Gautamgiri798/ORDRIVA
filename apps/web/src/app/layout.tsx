import type { Metadata } from 'next';
import './globals.css';
import { PosStoreProvider } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'ORDRIVA - Restaurant POS & Management System',
  description: 'Enterprise restaurant POS, KDS, inventory, table management and billing.',
  icons: {
    icon: '/ordriva-mark-transparent.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A] flex flex-col antialiased print:h-auto print:min-h-0 print:overflow-visible print:bg-white print:block" suppressHydrationWarning>
        <PosStoreProvider>
          <Navbar />
          <div className="flex flex-1 overflow-hidden min-h-0 print:block print:overflow-visible">
            <Sidebar />
            <main className="flex-1 overflow-y-auto min-h-0 bg-[#F8FAFC] print:block print:overflow-visible print:bg-white print:p-0 print:m-0">
              {children}
            </main>
          </div>
        </PosStoreProvider>
      </body>
    </html>
  );
}

