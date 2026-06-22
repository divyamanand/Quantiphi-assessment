import type { SubscriptionModel } from "../../generated/prisma/models.js";
import { AppError } from "./errors.js";

type Subscription = SubscriptionModel;

const RENEWAL_ALERT_DAYS = 7;

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toMonthlyRate(cost: number, billingCycle: string): number {
  return billingCycle === "Yearly" ? cost / 12 : cost;
}

export function daysUntilRenewal(nextRenewalDate: string): number {
  const renewal = new Date(nextRenewalDate);
  if (isNaN(renewal.getTime())) {
    throw new AppError(500, "Invalid renewal date in database record", "DATA_INTEGRITY_ERROR");
  }
  renewal.setHours(0, 0, 0, 0);
  const diff = renewal.getTime() - today().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
    renewingSoon: days >= 0 && days <= RENEWAL_ALERT_DAYS,
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
