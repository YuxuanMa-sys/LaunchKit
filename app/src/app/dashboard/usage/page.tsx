export default function UsagePage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Usage & Analytics</h1>
        <p className="mt-2 text-gray-600">
          Track your token usage, job counts, and costs over time
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-600">Total Tokens (30d)</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">1,245,032</div>
          <div className="mt-1 text-sm text-gray-500">Of 5M included</div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-600">Total Jobs (30d)</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">362</div>
          <div className="mt-1 text-sm text-green-600">90% success rate</div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-600">Total Cost (30d)</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">$24.90</div>
          <div className="mt-1 text-sm text-gray-500">No overage charges</div>
        </div>
      </div>

      {/* Usage Chart Placeholder */}
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">Usage Over Time</h2>
        <div className="mt-4 flex h-64 items-center justify-center border-2 border-dashed border-gray-300 rounded">
          <p className="text-gray-500">Chart will be implemented with Recharts</p>
        </div>
      </div>

      {/* Job History */}
      <div className="mt-8 rounded-lg bg-white shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className={`h-2 w-2 rounded-full ${i % 10 === 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                <div>
                  <div className="font-medium text-gray-900">job_abc{i}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    {i % 3 === 0 ? 'Translate' : i % 2 === 0 ? 'Embed' : 'Summarize'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {Math.floor(Math.random() * 5000) + 100} tokens
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {Math.floor(Math.random() * 24)} hours ago
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

