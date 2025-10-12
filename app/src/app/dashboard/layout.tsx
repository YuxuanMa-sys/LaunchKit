import { ReactNode } from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: ReactNode }) {
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
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">user@example.com</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
    </div>
  );
}

