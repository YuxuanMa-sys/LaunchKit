export default function BillingPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="mt-2 text-gray-600">
          Manage your subscription, invoices, and payment methods
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Current Plan: PRO</h2>
            <p className="mt-1 text-sm text-gray-600">
              $49/month • 5M tokens included • $0.02 per 1k overage
            </p>
          </div>
          <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
            Manage Subscription
          </button>
        </div>
      </div>

      {/* Usage This Month */}
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">Usage This Month</h2>
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tokens Used</span>
              <span className="font-medium text-gray-900">1,245,032 / 5,000,000</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 w-1/4 rounded-full bg-indigo-600" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm text-gray-600">Estimated Total</span>
            <span className="text-2xl font-semibold text-gray-900">$49.00</span>
          </div>
        </div>
      </div>

      {/* Plans Comparison */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">FREE</h3>
          <div className="mt-2 text-3xl font-bold text-gray-900">$0</div>
          <p className="mt-1 text-sm text-gray-600">per month</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>✓ 50,000 tokens/month</li>
            <li>✓ 3 team members</li>
            <li>✓ 1 API key</li>
            <li>✓ Community support</li>
          </ul>
        </div>
        <div className="rounded-lg border-2 border-indigo-600 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">PRO</h3>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">
              Current
            </span>
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">$49</div>
          <p className="mt-1 text-sm text-gray-600">per month</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>✓ 5M tokens/month</li>
            <li>✓ 10 team members</li>
            <li>✓ 5 API keys</li>
            <li>✓ Webhooks</li>
            <li>✓ Priority support</li>
          </ul>
        </div>
        <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">ENTERPRISE</h3>
          <div className="mt-2 text-3xl font-bold text-gray-900">Custom</div>
          <p className="mt-1 text-sm text-gray-600">Contact us</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>✓ Unlimited tokens</li>
            <li>✓ Unlimited team members</li>
            <li>✓ Unlimited API keys</li>
            <li>✓ Custom models</li>
            <li>✓ SLA & dedicated support</li>
          </ul>
          <button className="mt-4 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}

