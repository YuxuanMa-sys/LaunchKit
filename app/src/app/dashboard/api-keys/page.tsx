export default function ApiKeysPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="mt-2 text-gray-600">
            Manage your API keys for authenticating requests
          </p>
        </div>
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
          Create API Key
        </button>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="divide-y divide-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Production Key</div>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <code className="rounded bg-gray-100 px-2 py-1 font-mono">
                    lk_live_pk_tech_def***
                  </code>
                  <span>•</span>
                  <span>Last used 15 minutes ago</span>
                </div>
              </div>
              <button className="text-sm font-medium text-red-600 hover:text-red-500">
                Revoke
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Development Key</div>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <code className="rounded bg-gray-100 px-2 py-1 font-mono">
                    lk_test_pk_tech_abc***
                  </code>
                  <span>•</span>
                  <span>Last used 2 hours ago</span>
                </div>
              </div>
              <button className="text-sm font-medium text-red-600 hover:text-red-500">
                Revoke
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="font-medium text-yellow-900">⚠️ Keep your API keys secure</div>
        <p className="mt-1 text-sm text-yellow-700">
          API keys provide full access to your organization. Never share them publicly or
          commit them to version control.
        </p>
      </div>
    </div>
  );
}

