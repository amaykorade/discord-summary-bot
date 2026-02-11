/**
 * Billing types - Stripe-ready architecture.
 * Implement billing.service with Stripe when adding payments.
 */

export type Plan = 'FREE' | 'STARTER' | 'PRO';

export interface PlanLimits {
  maxMessagesPerDay: number;
  summariesPerDay: number;
}

export const PLAN_DISPLAY: Record<Plan, { name: string; price: string; priceNote?: string }> = {
  FREE: { name: 'FREE', price: '$0', priceNote: 'forever' },
  STARTER: { name: 'STARTER', price: '$12', priceNote: '/mo' },
  PRO: { name: 'PRO', price: '$39', priceNote: '/mo' },
};

export interface BillingContext {
  serverId: string;
  plan: Plan;
}

/**
 * Result of a limit check.
 */
export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}
