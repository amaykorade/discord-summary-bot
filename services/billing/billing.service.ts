/**
 * Billing service interface - Stripe-ready.
 *
 * When adding Stripe:
 * 1. Create stripe-billing.service.ts implementing this interface
 * 2. Wire subscription webhooks to update Server.plan
 * 3. Replace billingService usage with stripe implementation
 */

import type { Plan } from './types';

export interface IBillingService {
  /** Get current plan for a server (from DB; Stripe will sync via webhooks) */
  getPlan(serverId: string): Promise<Plan | null>;

  /** Create checkout session - implement with Stripe Checkout */
  createCheckoutSession?(serverId: string, plan: Plan): Promise<string>;

  /** Handle webhook - implement with Stripe webhooks */
  handleWebhook?(payload: unknown, signature: string): Promise<void>;
}
