import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-4xl px-4 py-16 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-gray-900 sm:text-7xl">
          LaunchKit AI
        </h1>
        <p className="mt-6 text-xl leading-8 text-gray-600">
          Production-grade starter for AI apps with usage-based billing
        </p>
        <p className="mt-4 text-lg text-gray-500">
          Organizations • RBAC • API Keys • Billing • Webhooks • Observability
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/dashboard"
            className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Go to Dashboard
          </Link>
          <Link
            href="https://github.com/YuxuanMa-sys/LaunchKit"
            target="_blank"
            className="text-lg font-semibold leading-6 text-gray-900"
          >
            View on GitHub <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-indigo-600">✓</div>
            <h3 className="mt-2 font-semibold text-gray-900">API Built</h3>
            <p className="mt-1 text-sm text-gray-600">
              NestJS REST API with 40+ endpoints
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-indigo-600">✓</div>
            <h3 className="mt-2 font-semibold text-gray-900">Database Ready</h3>
            <p className="mt-1 text-sm text-gray-600">
              Prisma schema with 15 models
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-yellow-500">⟳</div>
            <h3 className="mt-2 font-semibold text-gray-900">Dashboard In Progress</h3>
            <p className="mt-1 text-sm text-gray-600">
              Next.js App Router setup
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

