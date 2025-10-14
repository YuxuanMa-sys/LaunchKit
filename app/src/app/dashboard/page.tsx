'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api';

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

interface Job {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  tokenUsed?: number;
  input?: any;
  output?: any;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  revokedAt?: string;
}

interface DashboardData {
  usage: UsageData;
  recentJobs: Job[];
  apiKeys: ApiKey[];
  selectedOrg: any;
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
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

        // Fetch all data in parallel
        const [usageResponse, jobsResponse, apiKeysResponse] = await Promise.all([
          apiClient.get('/usage/current', {
            headers: { 'X-Org-Id': org.id },
          }),
          apiClient.get('/jobs/dashboard?limit=5', {
            headers: { 'X-Org-Id': org.id },
          }),
          apiClient.get('/api-keys'),
        ]);

        setData({
          usage: usageResponse.data,
          recentJobs: jobsResponse.data.jobs || [],
          apiKeys: apiKeysResponse.data || [],
          selectedOrg: org,
        });
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCost = (cents: number) => {
    return '$' + (cents / 100).toFixed(2);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getJobTypeDisplay = (type: string) => {
    switch (type) {
      case 'SUMMARIZE': return 'Summarize';
      case 'CLASSIFY': return 'Classify';
      case 'SENTIMENT': return 'Sentiment Analysis';
      case 'EXTRACT': return 'Extract';
      default: return type;
    }
  };

  const getJobDescription = (job: Job) => {
    const type = getJobTypeDisplay(job.type);
    
    // Try to create a meaningful description from the input
    if (job.input) {
      if (job.type === 'SUMMARIZE' && job.input.text) {
        const text = job.input.text;
        const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
        return `Summarized: "${preview}"`;
      }
      if (job.type === 'CLASSIFY' && job.input.text) {
        const text = job.input.text;
        const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
        return `Classified: "${preview}"`;
      }
      if (job.type === 'SENTIMENT' && job.input.text) {
        const text = job.input.text;
        const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
        return `Analyzed sentiment: "${preview}"`;
      }
      if (job.type === 'EXTRACT' && job.input.text) {
        const text = job.input.text;
        const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
        return `Extracted from: "${preview}"`;
      }
    }
    
    // Fallback to generic description
    return `${type} task completed`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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

  if (!data) {
    return <div className="p-8">No data available</div>;
  }

  const { usage, recentJobs, apiKeys, selectedOrg } = data;
  const activeApiKeys = apiKeys.filter(key => !key.revokedAt);

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
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {formatNumber(usage.usage.tokens)}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {usage.limits.tokens === -1 ? 'Unlimited' : `of ${formatNumber(usage.limits.tokens)}`}
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-600">Jobs Processed</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {usage.usage.jobs}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {usage.limits.jobs === -1 ? 'Unlimited' : `of ${usage.limits.jobs}`}
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-600">Estimated Cost</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {formatCost(usage.costCents)}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {selectedOrg.planTier} plan
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-600">Active API Keys</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {activeApiKeys.length}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {selectedOrg.planTier === 'FREE' ? '1 max on FREE plan' : 
             selectedOrg.planTier === 'PRO' ? '5 max on PRO plan' : 
             'Unlimited on ENTERPRISE plan'}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        <div className="mt-4 rounded-lg bg-white shadow">
          {recentJobs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      {getJobDescription(job)}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {getJobTypeDisplay(job.type)} task
                      {job.tokenUsed && ` • ${job.tokenUsed} tokens`}
                      {job.tokenUsed && ` • ${formatCost(job.tokenUsed * 0.00002)}`}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTimeAgo(job.completedAt || job.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No recent activity. Create your first job to see it here!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

