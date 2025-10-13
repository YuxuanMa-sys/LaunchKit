'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, CreditCard, ExternalLink } from 'lucide-react';
import apiClient from '@/lib/api';
import { useUser } from '@clerk/nextjs';

interface BillingInfo {
  orgId: string;
  orgName: string;
  planTier: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  upcomingInvoice: {
    amount: number;
    currency: string;
    date: string;
  } | null;
}

interface Organization {
  id: string;
  name: string;
  planTier: string;
}

const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      '2 API keys',
      '1,000 API calls/month',
      'Community support',
      'Basic analytics',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 49,
    features: [
      '10 API keys',
      '100,000 API calls/month',
      'Priority email support',
      'Advanced analytics',
      'Webhooks',
      'Custom rate limits',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 299,
    features: [
      'Unlimited API keys',
      'Unlimited API calls',
      '24/7 phone support',
      'Custom analytics',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom integrations',
    ],
  },
};

export default function BillingPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      // Add delay to ensure Clerk is fully loaded
      const timer = setTimeout(() => {
        loadOrganizations();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (selectedOrg) {
      loadBillingInfo(selectedOrg.id);
    }
  }, [selectedOrg]);

  const loadOrganizations = async () => {
    try {
      const response = await apiClient.get('/orgs');
      setOrganizations(response.data);
      if (response.data.length > 0) {
        setSelectedOrg(response.data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load organizations:', err);
      setError('Failed to load organizations');
    }
  };

  const loadBillingInfo = async (orgId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/orgs/${orgId}/billing`);
      setBillingInfo(response.data);
    } catch (err: any) {
      console.error('Failed to load billing info:', err);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planTier: 'PRO' | 'ENTERPRISE') => {
    if (!selectedOrg) return;

    setLoadingAction(`upgrade_${planTier}`);
    setError(null);

    try {
      const response = await apiClient.post(`/orgs/${selectedOrg.id}/billing/checkout`, {
        planTier,
        successUrl: `${window.location.origin}/dashboard/billing?success=true`,
        cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
      });

      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err: any) {
      console.error('Failed to create checkout session:', err);
      setError('Failed to start upgrade process. Please try again.');
      setLoadingAction(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!selectedOrg) return;

    setLoadingAction('portal');
    setError(null);

    try {
      const response = await apiClient.post(`/orgs/${selectedOrg.id}/billing/portal`, {
        returnUrl: `${window.location.origin}/dashboard/billing`,
      });

      // Redirect to Stripe Billing Portal
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err: any) {
      console.error('Failed to create portal session:', err);
      setError('Failed to open billing portal. Please try again.');
      setLoadingAction(null);
    }
  };

  if (loading || !billingInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading billing information...</div>
      </div>
    );
  }

  const currentPlan = billingInfo.planTier as keyof typeof PLANS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your subscription and billing settings
        </p>
      </div>

      {/* Organization Selector */}
      {organizations.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization
          </label>
          <select
            value={selectedOrg?.id || ''}
            onChange={(e) => {
              const org = organizations.find((o) => o.id === e.target.value);
              if (org) setSelectedOrg(org);
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.planTier})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Current Subscription Status */}
      {billingInfo.subscriptionStatus && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">{billingInfo.subscriptionStatus}</span>
            </div>
            {billingInfo.currentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-gray-600">Renews on:</span>
                <span className="font-medium">
                  {new Date(billingInfo.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}
            {billingInfo.upcomingInvoice && (
              <div className="flex justify-between">
                <span className="text-gray-600">Next payment:</span>
                <span className="font-medium">
                  ${(billingInfo.upcomingInvoice.amount / 100).toFixed(2)}{' '}
                  {billingInfo.upcomingInvoice.currency.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleManageSubscription}
            disabled={loadingAction === 'portal'}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200 disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" />
            {loadingAction === 'portal' ? 'Loading...' : 'Manage Subscription'}
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PLANS).map(([tier, plan]) => {
          const isCurrent = currentPlan === tier;
          const canUpgrade = 
            (currentPlan === 'FREE' && tier !== 'FREE') ||
            (currentPlan === 'PRO' && tier === 'ENTERPRISE');

          return (
            <div
              key={tier}
              className={`relative rounded-lg border-2 p-6 ${
                isCurrent
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    <CheckCircle2 className="h-3 w-3" />
                    Current Plan
                  </span>
                </div>
              )}

              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                <span className="ml-2 text-gray-600">/month</span>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              {canUpgrade && (
                <button
                  onClick={() => handleUpgrade(tier as 'PRO' | 'ENTERPRISE')}
                  disabled={loadingAction === `upgrade_${tier}`}
                  className="mt-6 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loadingAction === `upgrade_${tier}` ? 'Loading...' : 'Upgrade'}
                </button>
              )}

              {isCurrent && tier !== 'FREE' && (
                <button
                  onClick={handleManageSubscription}
                  disabled={loadingAction === 'portal'}
                  className="mt-6 w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {loadingAction === 'portal' ? 'Loading...' : 'Manage'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
