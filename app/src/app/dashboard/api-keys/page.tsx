'use client';

import { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api';
import { useUser } from '@clerk/nextjs';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  org: {
    id: string;
    name: string;
    planTier: string;
  };
  lastUsedAt: string | null;
  createdAt: string;
}

interface NewApiKeyResponse extends ApiKey {
  key: string;
  warning: string;
}

export default function ApiKeysPage() {
  const { user, isLoaded } = useUser();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [userOrgs, setUserOrgs] = useState<any[]>([]);
  const [createdKey, setCreatedKey] = useState<NewApiKeyResponse | null>(null);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && user) {
      // Add a small delay to ensure Clerk is fully initialized
      const timer = setTimeout(() => {
        loadApiKeys();
        loadOrganizations();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, user]);

  const loadApiKeys = async () => {
    try {
      const response = await apiClient.get<ApiKey[]>('/api-keys');
      setKeys(response.data);
    } catch (err: any) {
      console.error('Failed to load API keys:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please try refreshing the page.');
      } else {
        setError(err.response?.data?.message || 'Failed to load API keys');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await apiClient.get('/orgs');
      console.log('Organizations loaded:', response.data);
      setUserOrgs(response.data);
      if (response.data.length > 0) {
        const firstOrgId = response.data[0].id;
        console.log('Setting selectedOrgId to:', firstOrgId);
        setSelectedOrgId(firstOrgId);
      }
    } catch (err: any) {
      console.error('Failed to load organizations:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please try refreshing the page.');
      }
    }
  };

  const createApiKey = async () => {
    console.log('Creating API key with:', { name: newKeyName, orgId: selectedOrgId });
    
    if (!newKeyName.trim() || !selectedOrgId) {
      setError('Please provide a name and select an organization');
      return;
    }

    try {
      const response = await apiClient.post<NewApiKeyResponse>('/api-keys', {
        name: newKeyName,
        orgId: selectedOrgId,
      });

      setCreatedKey(response.data);
      setNewKeyName('');
      setShowCreateModal(false);
      
      // Reload the keys list
      await loadApiKeys();
    } catch (err: any) {
      console.error('Failed to create API key:', err);
      setError(err.response?.data?.message || 'Failed to create API key');
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/api-keys/${keyId}`);
      // Remove from local state
      setKeys(keys.filter((k) => k.id !== keyId));
    } catch (err: any) {
      console.error('Failed to revoke API key:', err);
      setError(err.response?.data?.message || 'Failed to revoke API key');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage API keys for programmatic access
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Create Key
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* New Key Created Success */}
      {createdKey && (
        <div className="rounded-md bg-green-50 border-2 border-green-200 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">API Key Created!</h3>
              <p className="mt-1 text-sm text-green-700">{createdKey.warning}</p>
              
              <div className="mt-4 p-4 bg-white rounded-md border border-green-300">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-gray-900 select-all">
                    {createdKey.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdKey.key)}
                    className="ml-4 inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-500"
                  >
                    {copying ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setCreatedKey(null)}
              className="text-green-600 hover:text-green-800 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your API Keys</h2>
        </div>
        
        {keys.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Key className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No API keys</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new API key.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Create Your First Key
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {keys.map((key) => (
              <div key={key.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-gray-900">{key.name}</h3>
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                        {key.org.planTier}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">
                        {key.prefix}***
                      </code>
                      <span>{key.org.name}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Created {formatDate(key.createdAt)}
                      {key.lastUsedAt && ` • Last used ${formatDate(key.lastUsedAt)}`}
                    </div>
                  </div>
                  <button
                    onClick={() => revokeApiKey(key.id)}
                    className="ml-4 inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900">Create API Key</h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose a name to help you identify this key later.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="key-name" className="block text-sm font-medium text-gray-700">
                  Key Name
                </label>
                <input
                  type="text"
                  id="key-name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="org-select" className="block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <select
                  id="org-select"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {userOrgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.planTier})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={createApiKey}
                className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Create Key
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKeyName('');
                  setError('');
                }}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
