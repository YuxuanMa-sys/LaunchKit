export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your API usage, costs, and activity
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-600">Tokens This Month</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">1.2M</div>
          <div className="mt-1 text-sm text-green-600">+12% from last month</div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-600">Jobs Processed</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">362</div>
          <div className="mt-1 text-sm text-green-600">+8% from last month</div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-600">Estimated Cost</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">$24.90</div>
          <div className="mt-1 text-sm text-gray-500">Of $49 plan</div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-600">Active API Keys</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">2</div>
          <div className="mt-1 text-sm text-gray-500">5 max on PRO plan</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        <div className="mt-4 rounded-lg bg-white shadow">
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-gray-900">Job #{1000 + i} completed</div>
                  <div className="mt-1 text-sm text-gray-500">
                    Summarize task • 1,234 tokens • $0.02
                  </div>
                </div>
                <div className="text-sm text-gray-500">2 hours ago</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

