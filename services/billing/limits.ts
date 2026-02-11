/**
 * Plan limits configuration.
 * Stripe integration will drive plan assignment; limits are defined here.
 */

import type { Plan, PlanLimits } from './types';

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxMessagesPerDay: 1000,
    summariesPerDay: 1,
  },
  STARTER: {
    maxMessagesPerDay: 5000,
    summariesPerDay: 2,
  },
  PRO: {
    maxMessagesPerDay: 25_000,
    summariesPerDay: 4,
  },
};
