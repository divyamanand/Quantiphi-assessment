import type { SubscriptionModel } from "../../generated/prisma/models.js";
import { AppError } from "./errors.js";

type Subscription = SubscriptionModel;

const RENEWAL_ALERT_DAYS = 7;

// Returns today as a UTC midnight timestamp — avoids local-timezone drift when
// comparing against YYYY-MM-DD strings, which Date.parse() always treats as UTC.
function todayUTC(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function toMonthlyRate(cost: number, billingCycle: string): number {
  return billingCycle === "Yearly" ? cost / 12 : cost;
}

export function daysUntilRenewal(nextRenewalDate: string): number {
  // Date.parse on a bare YYYY-MM-DD string produces UTC midnight — keep both
  // sides in UTC so the diff is timezone-agnostic.
  const renewalUTC = Date.parse(nextRenewalDate);
  if (isNaN(renewalUTC)) {
    throw new AppError(500, "Invalid renewal date in database record", "DATA_INTEGRITY_ERROR");
  }
  return Math.ceil((renewalUTC - todayUTC()) / (1000 * 60 * 60 * 24));
}

export interface EnrichedSubscription extends Subscription {
  monthlyRate: number;
  daysUntilRenewal: number;
  renewingSoon: boolean;
}

export function enrichSubscription(sub: Subscription): EnrichedSubscription {
  const days = daysUntilRenewal(sub.nextRenewalDate);
  return {
    ...sub,
    monthlyRate: parseFloat(toMonthlyRate(sub.cost, sub.billingCycle).toFixed(2)),
    daysUntilRenewal: days,
    // Paused subscriptions never show as renewing soon — the badge would contradict the paused state.
    renewingSoon: sub.status === "Active" && days >= 0 && days <= RENEWAL_ALERT_DAYS,
  };
}

export interface Metrics {
  totalMonthlyBurn: number;
  upcomingRenewalsCount: number;
}

export function computeMetrics(subscriptions: Subscription[]): Metrics {
  const enriched = subscriptions.map(enrichSubscription);

  const totalMonthlyBurn = enriched
    .filter((s) => s.status === "Active")
    .reduce((sum, s) => sum + s.monthlyRate, 0);

  const upcomingRenewalsCount = enriched.filter(
    (s) => s.status === "Active" && s.renewingSoon
  ).length;

  return {
    totalMonthlyBurn: parseFloat(totalMonthlyBurn.toFixed(2)),
    upcomingRenewalsCount,
  };
}
