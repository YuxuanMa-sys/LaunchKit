'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api';
import { Activity, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

interface UsageData {
  month: string;
  jobs: number;
  tokens: number;
  costCents: number;
  limits: {
    jobs: number;
    tokens: number;
  };
  usage: {
    jobs: number;
    tokens: number;
  };
  percentUsed: {
    jobs: number;
    tokens: number;
  };
}

interface AnalyticsData {
  date: string;
  jobs: number;
  tokens: number;
  costCents: number;
}

export default function UsagePage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auth token
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      // Get organizations
      const orgsResponse = await apiClient.get('/orgs');
      const orgs = orgsResponse.data;
      
      if (orgs && orgs.length > 0) {
        const org = orgs[0];
        setSelectedOrg(org);

        // Get current usage
        const usageResponse = await apiClient.get(`/usage/current`, {
          headers: { 'X-Org-Id': org.id },
        });
        setUsageData(usageResponse.data);

        // Get analytics data
        const analyticsResponse = await apiClient.get(`/usage/analytics?days=30`, {
          headers: { 'X-Org-Id': org.id },
        });
        setAnalyticsData(analyticsResponse.data);
      }
    } catch (err: any) {
      console.error('Failed to load usage data:', err);
      setError(err.response?.data?.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return <div className="p-8">No usage data available</div>;
  }

  const isUnlimited = usageData.limits.jobs === -1;
  const jobsPercent = isUnlimited ? 0 : usageData.percentUsed.jobs;
  const tokensPercent = isUnlimited ? 0 : usageData.percentUsed.tokens;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Usage & Analytics</h1>
        <p className="mt-2 text-gray-600">
          Track your API usage and monitor consumption
        </p>
      </div>

      {/* Usage Alert */}
      {(jobsPercent > 80 || tokensPercent > 80) && !isUnlimited && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">Approaching Usage Limit</h3>
            <p className="text-sm text-yellow-800 mt-1">
              You&apos;ve used over 80% of your monthly quota. Consider upgrading your plan to avoid service interruption.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Jobs Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">API Calls</h3>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">
              {usageData.usage.jobs.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {isUnlimited
                ? 'Unlimited'
                : `of ${usageData.limits.jobs.toLocaleString()} this month`}
            </p>
            {!isUnlimited && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      jobsPercent > 90
                        ? 'bg-red-600'
                        : jobsPercent > 80
                        ? 'bg-yellow-600'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(jobsPercent, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{jobsPercent.toFixed(1)}% used</p>
              </div>
            )}
          </div>
        </div>

        {/* Tokens Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Tokens</h3>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">
              {usageData.usage.tokens.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {isUnlimited
                ? 'Unlimited'
                : `of ${usageData.limits.tokens.toLocaleString()} this month`}
            </p>
            {!isUnlimited && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      tokensPercent > 90
                        ? 'bg-red-600'
                        : tokensPercent > 80
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(tokensPercent, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{tokensPercent.toFixed(1)}% used</p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Estimated Cost</h3>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">
              ${(usageData.costCents / 100).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">This month</p>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Usage Trends (Last 30 Days)</h2>
        
        {analyticsData.length === 0 ? (
          <p className="text-gray-600 text-center py-12">No usage data yet. Start using the API to see trends here.</p>
        ) : (
          <div className="space-y-6">
            {/* Simple bar chart */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Daily API Calls</h3>
              <div className="space-y-2">
                {analyticsData.slice(-14).map((day) => {
                  const maxJobs = Math.max(...analyticsData.map((d) => d.jobs));
                  const width = maxJobs > 0 ? (day.jobs / maxJobs) * 100 : 0;
                  
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20">{day.date.substring(5)}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                        <div
                          className="bg-indigo-600 h-8 rounded-full flex items-center justify-end pr-3"
                          style={{ width: `${Math.max(width, 5)}%` }}
                        >
                          <span className="text-xs font-medium text-white">{day.jobs}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Token usage */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Daily Token Usage</h3>
              <div className="space-y-2">
                {analyticsData.slice(-14).map((day) => {
                  const maxTokens = Math.max(...analyticsData.map((d) => d.tokens));
                  const width = maxTokens > 0 ? (day.tokens / maxTokens) * 100 : 0;
                  
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20">{day.date.substring(5)}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                        <div
                          className="bg-green-600 h-8 rounded-full flex items-center justify-end pr-3"
                          style={{ width: `${Math.max(width, 5)}%` }}
                        >
                          <span className="text-xs font-medium text-white">
                            {day.tokens.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade CTA for non-enterprise users */}
      {!isUnlimited && (jobsPercent > 50 || tokensPercent > 50) && (
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need more capacity?</h3>
          <p className="text-gray-600 mb-4">
            Upgrade to PRO or ENTERPRISE for higher limits and priority support.
          </p>
          <a
            href="/dashboard/billing"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            View Plans
          </a>
        </div>
      )}
    </div>
  );
}
