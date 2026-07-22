/**
 * Billing Period Utilities
 *
 * All quota windows are anchored to a fixed billing timezone (IST by default,
 * overridable via BILLING_TIMEZONE_OFFSET_MINUTES) so that "daily" means the
 * same thing for every user regardless of device locale.
 *
 * ─── Why period *keys* instead of cron-driven resets ──────────────────────────
 * A usage counter is stored against a deterministic string key derived from the
 * current instant (e.g. `2026-07-19` for daily, `2026-07` for monthly). When the
 * window rolls over, the key changes, so the lookup naturally misses and a fresh
 * zeroed counter is created on demand.
 *
 * This makes resets *self-healing*: if the server is down at midnight, if a cron
 * job fails, or if the process is scaled to N replicas, quotas still reset
 * correctly because nothing has to run at a particular moment. The cron jobs in
 * this module therefore only do housekeeping (pruning stale rows, reconciling
 * drift) and are never load-bearing for correctness.
 */

import { BILLING_TZ_OFFSET_MINUTES } from '../config/billing.config';

/** A quota window. `lifetime` never resets; `none` means the feature is ungated. */
export type PeriodType = 'daily' | 'monthly' | 'lifetime' | 'none';

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

/** Shifts a UTC instant into billing-local wall-clock time. */
function toBillingLocal(date: Date): Date {
  return new Date(date.getTime() + BILLING_TZ_OFFSET_MINUTES * MS_PER_MINUTE);
}

/** Shifts a billing-local wall-clock time back to a true UTC instant. */
function fromBillingLocal(date: Date): Date {
  return new Date(date.getTime() - BILLING_TZ_OFFSET_MINUTES * MS_PER_MINUTE);
}

/**
 * Deterministic key identifying the quota window `at` falls into.
 * Two calls within the same window always produce the same key.
 */
export function getPeriodKey(period: PeriodType, at: Date = new Date()): string {
  const local = toBillingLocal(at);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');

  switch (period) {
    case 'daily':
      return `${year}-${month}-${day}`;
    case 'monthly':
      return `${year}-${month}`;
    case 'lifetime':
    case 'none':
      return 'lifetime';
  }
}

/** Start of the current billing day, as a UTC instant. */
export function startOfBillingDay(at: Date = new Date()): Date {
  const local = toBillingLocal(at);
  return fromBillingLocal(
    new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()))
  );
}

/** Exclusive end of the current billing day — i.e. the next day's start. */
export function endOfBillingDay(at: Date = new Date()): Date {
  return new Date(startOfBillingDay(at).getTime() + MS_PER_DAY);
}

/** Start of the current billing month, as a UTC instant. */
export function startOfBillingMonth(at: Date = new Date()): Date {
  const local = toBillingLocal(at);
  return fromBillingLocal(new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1)));
}

/** Exclusive end of the current billing month. */
export function endOfBillingMonth(at: Date = new Date()): Date {
  const local = toBillingLocal(at);
  return fromBillingLocal(new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1)));
}

/**
 * When the given quota window next resets. Used to tell clients exactly when
 * their limit frees up. `lifetime`/`none` windows never reset, hence null.
 */
export function getPeriodResetAt(period: PeriodType, at: Date = new Date()): Date | null {
  switch (period) {
    case 'daily':
      return endOfBillingDay(at);
    case 'monthly':
      return endOfBillingMonth(at);
    case 'lifetime':
    case 'none':
      return null;
  }
}
