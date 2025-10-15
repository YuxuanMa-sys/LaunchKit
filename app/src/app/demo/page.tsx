'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import apiClient from '@/lib/api';

interface JobData {
  type: 'SUMMARIZE' | 'CLASSIFY' | 'SENTIMENT' | 'EXTRACT' | 'TRANSLATE';
  input: string;
  parameters?: {
    max_tokens?: number;
    temperature?: number;
    model?: string;
  };
}

export default function DemoPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobData, setJobData] = useState<JobData>({
    type: 'SUMMARIZE',
    input: 'Write a short story about a robot learning to paint.',
    parameters: {
      max_tokens: 150,
      temperature: 0.7,
      model: 'gpt-3.5-turbo'
    }
  });
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [loadingApiKeys, setLoadingApiKeys] = useState<boolean>(false);
  const [manualApiKey, setManualApiKey] = useState<string>('');
  const [useManualKey, setUseManualKey] = useState<boolean>(false);

  const loadApiKeys = async () => {
    setLoadingApiKeys(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await apiClient.get('/api-keys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const keys = response.data || [];
      console.log('API Keys response:', keys);
      setApiKeys(keys);
      if (keys.length > 0 && !selectedApiKey) {
        // Use the prefix as the key value
        const firstKey = keys[0].prefix || keys[0].id;
        setSelectedApiKey(firstKey);
      }
    } catch (err: any) {
      console.error('Failed to load API keys:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setLoadingApiKeys(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const apiKeyToUse = useManualKey ? manualApiKey : selectedApiKey;
      
      if (!apiKeyToUse) {
        throw new Error('Please select an API key or enter one manually');
      }

      // Create the job using API key authentication
      const response = await apiClient.post('/jobs', {
        type: jobData.type,
        input: jobData.input,
        parameters: jobData.parameters
      }, {
        headers: {
          'Authorization': `Bearer ${apiKeyToUse}`,
          'X-API-Key': apiKeyToUse
        }
      });

      setResult(response.data);
    } catch (err: any) {
      console.error('Failed to create job:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const handleInputChange = (field: keyof JobData, value: any) => {
    setJobData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleParameterChange = (key: string, value: any) => {
    setJobData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">LaunchKit AI Demo</h1>
          <p className="mt-2 text-gray-600">
            Test the AI job creation functionality
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Key Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedApiKey}
                  onChange={(e) => setSelectedApiKey(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loadingApiKeys}
                >
                  <option value="">
                    {loadingApiKeys ? 'Loading API keys...' : 'Select an API key'}
                  </option>
                  {apiKeys.map((key) => {
                    // The API only returns the prefix, not the full key
                    const keyValue = key.prefix || key.id || '';
                    const keyName = key.name || 'Unnamed Key';
                    const orgName = key.org?.name || 'Unknown Org';
                    
                    return (
                      <option key={key.id} value={keyValue}>
                        {keyName} ({keyValue}) - {orgName}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  onClick={loadApiKeys}
                  disabled={loadingApiKeys}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  {loadingApiKeys ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {apiKeys.length === 0 && !loadingApiKeys && (
                <p className="mt-1 text-sm text-gray-500">
                  No API keys found. Create one in the API Keys section first.
                </p>
              )}
              {apiKeys.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Note: The dropdown shows API key prefixes. For authentication, you need the full API key (use manual input below).
                </p>
              )}
            </div>

            {/* Manual API Key Input */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="useManualKey"
                  checked={useManualKey}
                  onChange={(e) => setUseManualKey(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="useManualKey" className="text-sm font-medium text-gray-700">
                  Enter full API key manually (required for authentication)
                </label>
              </div>
              
              {useManualKey && (
                <input
                  type="password"
                  value={manualApiKey}
                  onChange={(e) => setManualApiKey(e.target.value)}
                  placeholder="lk_test_pk_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <select
                value={jobData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="SUMMARIZE">Summarize</option>
                <option value="CLASSIFY">Classify</option>
                <option value="SENTIMENT">Sentiment Analysis</option>
                <option value="EXTRACT">Extract</option>
                <option value="TRANSLATE">Translate</option>
              </select>
            </div>

            {/* Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input
              </label>
              <textarea
                value={jobData.input}
                onChange={(e) => handleInputChange('input', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your prompt or text here..."
              />
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={jobData.parameters?.max_tokens || 150}
                  onChange={(e) => handleParameterChange('max_tokens', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={jobData.parameters?.temperature || 0.7}
                  onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={jobData.parameters?.model || 'gpt-3.5-turbo'}
                  onChange={(e) => handleParameterChange('model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Job...' : 'Create Job'}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="text-green-800 mb-2">
                <strong>Job Created Successfully!</strong>
              </div>
              <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">How to Use This Demo</h3>
              <div className="text-blue-800 space-y-2">
                <p>1. Make sure you&apos;re logged in with Clerk authentication</p>
                <p>2. Create an API key in the API Keys section first</p>
                <p>3. <strong>Copy the full API key</strong> (starts with lk_live_pk_ or lk_test_pk_)</p>
                <p>4. Check &quot;Enter full API key manually&quot; and paste the complete key</p>
                <p>5. Select a job type (Summarize, Classify, etc.)</p>
                <p>6. Enter your input text and adjust parameters</p>
                <p>7. Click &quot;Create Job&quot; to test the AI job creation API</p>
                <p>8. Check the result to see the job details and status</p>
              </div>
        </div>
      </div>
    </div>
  );
}
