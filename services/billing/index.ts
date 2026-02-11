/**
 * Billing module - Stripe-ready architecture.
 *
 * Structure for future integration:
 * - types.ts: Plan, limits, interfaces
 * - limits.ts: Plan limit constants
 * - plan-limits.middleware.ts: Enforce limits (messages/day, summaries/day)
 * - billing.service.ts: Interface for Stripe implementation
 *
 * To add Stripe: implement stripe-billing.service.ts and wire webhooks.
 */

export * from './types';
export * from './limits';
export * from './plan-limits.middleware';
export type { IBillingService } from './billing.service';
