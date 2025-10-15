import { ReactNode } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  
  if (!userId) {
    return null; // Middleware will redirect
  }
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              LaunchKit AI
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/usage"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Usage
              </Link>
              <Link
                href="/dashboard/api-keys"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                API Keys
              </Link>
              <Link
                href="/dashboard/billing"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Billing
              </Link>
              <Link
                href="/demo"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Demo
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-10 h-10',
                },
              }}
              afterSignOutUrl="/"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
    </div>
  );
}

