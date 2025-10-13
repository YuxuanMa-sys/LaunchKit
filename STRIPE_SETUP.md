# 💳 Stripe Integration Setup Guide

This guide will help you set up Stripe for billing in LaunchKit AI.

## 📋 Prerequisites

1. Stripe account (create at [stripe.com](https://stripe.com))
2. Stripe API keys
3. Stripe CLI (for webhook testing)

---

## 🔑 Step 1: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** → **API Keys**
3. Copy your:
   - **Secret key** (starts with `sk_test_...` for test mode)
   - **Publishable key** (starts with `pk_test_...`)

4. Add to `api/.env`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_key_here
   ```

---

## 💰 Step 2: Create Products & Prices

### Option A: Via Stripe Dashboard

1. Go to **Products** → **Add Product**

2. **Create PRO Plan:**
   - Name: `LaunchKit AI - Pro`
   - Description: `Professional plan with 100K API calls/month`
   - Pricing: **Recurring** → $49/month
   - Copy the **Price ID** (starts with `price_...`)

3. **Create ENTERPRISE Plan:**
   - Name: `LaunchKit AI - Enterprise`
   - Description: `Enterprise plan with unlimited API calls`
   - Pricing: **Recurring** → $299/month
   - Copy the **Price ID**

4. Add Price IDs to `api/.env`:
   ```bash
   STRIPE_PRO_PRICE_ID=price_1234567890pro
   STRIPE_ENTERPRISE_PRICE_ID=price_1234567890ent
   ```

### Option B: Via Stripe API/CLI

```bash
# Create PRO product & price
stripe products create \
  --name="LaunchKit AI - Pro" \
  --description="Professional plan"

stripe prices create \
  --product=prod_xxx \
  --unit-amount=4900 \
  --currency=usd \
  --recurring[interval]=month

# Create ENTERPRISE product & price
stripe products create \
  --name="LaunchKit AI - Enterprise" \
  --description="Enterprise plan"

stripe prices create \
  --product=prod_yyy \
  --unit-amount=29900 \
  --currency=usd \
  --recurring[interval]=month
```

---

## 🔔 Step 3: Set Up Webhooks

Webhooks allow Stripe to notify your API about subscription events (payments, cancellations, etc.)

### For Local Development:

1. **Install Stripe CLI:**
   ```bash
   # Mac
   brew install stripe/stripe-cli/stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local API:**
   ```bash
   stripe listen --forward-to http://localhost:3001/v1/webhooks/stripe
   ```

4. **Copy the webhook signing secret** (starts with `whsec_...`) and add to `api/.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

5. **Keep the Stripe CLI running** while developing!

### For Production:

1. Go to **Developers** → **Webhooks** in Stripe Dashboard

2. Click **Add endpoint**

3. **Endpoint URL:** `https://your-api-domain.com/v1/webhooks/stripe`

4. **Select events to listen to:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

5. Click **Add endpoint**

6. Copy the **Signing secret** and add to your production environment variables

---

## ✅ Step 4: Test the Integration

### 1. Start Your Services:

```bash
# Terminal 1: Start API
cd api
pnpm dev

# Terminal 2: Start Dashboard
cd app
pnpm dev

# Terminal 3: Forward Stripe webhooks (local only)
stripe listen --forward-to http://localhost:3001/v1/webhooks/stripe
```

### 2. Test Upgrade Flow:

1. Go to `http://localhost:3000/dashboard/billing`
2. Click **Upgrade** on the PRO or ENTERPRISE plan
3. You'll be redirected to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

5. Complete payment
6. You'll be redirected back to your dashboard
7. Check the database:
   ```sql
   SELECT "planTier", "subscriptionStatus" FROM orgs WHERE id = 'your-org-id';
   ```

### 3. Test Webhook Events:

```bash
# Trigger a test webhook
stripe trigger customer.subscription.created
```

Check your API logs - you should see:
```
Webhook received: customer.subscription.created
Organization upgraded to: PRO
```

### 4. Test Billing Portal:

1. Go to `http://localhost:3000/dashboard/billing`
2. Click **Manage Subscription**
3. You'll be redirected to Stripe Customer Portal
4. You can:
   - Update payment method
   - Cancel subscription
   - View invoices

---

## 🧪 Test Cards

Stripe provides test cards for different scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0000 0000 0341` | Card expires before charge |

**Use any expiry date in the future, any 3-digit CVC, and any postal code.**

---

## 📊 Subscription Flow

```
1. User clicks "Upgrade to PRO"
   ↓
2. API creates Stripe Checkout Session
   ↓
3. User redirected to Stripe Checkout
   ↓
4. User enters payment details
   ↓
5. Stripe processes payment
   ↓
6. Stripe sends webhook: customer.subscription.created
   ↓
7. API receives webhook, updates org.planTier = "PRO"
   ↓
8. User redirected back to dashboard
   ↓
9. Dashboard shows PRO features unlocked!
```

---

## 🔒 Security Best Practices

1. **Never commit Stripe keys to git**
   - Keys should only be in `.env` files (which are gitignored)

2. **Always verify webhook signatures**
   - Already implemented in `billing.service.ts`

3. **Use test mode for development**
   - Test keys start with `sk_test_` and `pk_test_`
   - Production keys start with `sk_live_` and `pk_live_`

4. **Rotate keys if compromised**
   - Go to Stripe Dashboard → API Keys → Roll Key

---

## 🐛 Troubleshooting

### "Webhook signature verification failed"
- **Cause:** Wrong `STRIPE_WEBHOOK_SECRET`
- **Fix:** Copy the webhook secret from Stripe CLI or Dashboard

### "Price ID not configured"
- **Cause:** Missing price IDs in `.env`
- **Fix:** Add `STRIPE_PRO_PRICE_ID` and `STRIPE_ENTERPRISE_PRICE_ID`

### "No such customer"
- **Cause:** Customer not created in Stripe
- **Fix:** The API automatically creates customers on first checkout

### Subscription not updating in database
- **Cause:** Webhook not reaching API or failing silently
- **Fix:** 
  1. Check Stripe CLI is running (`stripe listen`)
  2. Check API logs for webhook errors
  3. Check `stripe_events` table for failed events

---

## 📈 Going to Production

1. **Switch to live mode** in Stripe Dashboard

2. **Create live products and prices** (same as test mode)

3. **Update environment variables:**
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PRO_PRICE_ID=price_live_...
   STRIPE_ENTERPRISE_PRICE_ID=price_live_...
   ```

4. **Set up production webhook endpoint** in Stripe Dashboard

5. **Test with real (small) payments first!**

6. **Monitor:**
   - Stripe Dashboard → Events (for webhook delivery)
   - Stripe Dashboard → Customers (for subscriptions)
   - Your database → `audit_logs` table

---

## 💡 Additional Features to Implement

- [ ] **Proration:** Handle mid-cycle plan changes
- [ ] **Trials:** Offer 14-day free trials
- [ ] **Coupons:** Create discount codes
- [ ] **Usage-based billing:** Charge per API call
- [ ] **Tax collection:** Use Stripe Tax
- [ ] **Email notifications:** Send receipts via Stripe
- [ ] **Dunning:** Auto-retry failed payments

---

## 📚 Resources

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Test Cards](https://stripe.com/docs/testing)
- [Subscription Lifecycle](https://stripe.com/docs/billing/subscriptions/overview)

---

**🎉 You're all set! Your billing system is production-ready!**

