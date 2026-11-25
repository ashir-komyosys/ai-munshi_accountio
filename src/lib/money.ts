/**
 * Exact integer minor-unit (paisa = 1/100 PKR) arithmetic utilities.
 * All monetary amounts in Accountio AI are stored as integer PKR or paisa
 * to prevent floating-point rounding drift in ledgers, trial balances, and reports.
 */

export function toPaisa(pkr: number): number {
  return Math.round(pkr * 100);
}

export function fromPaisa(paisa: number): number {
  return Math.round(paisa) / 100;
}

export function addMoney(...amounts: number[]): number {
  const totalPaisa = amounts.reduce((sum, val) => sum + Math.round(val * 100), 0);
  return Math.round(totalPaisa) / 100;
}

export function subMoney(a: number, b: number): number {
  return (Math.round(a * 100) - Math.round(b * 100)) / 100;
}

export function mulMoney(amount: number, qty: number): number {
  return Math.round(amount * 100 * qty) / 100;
}

export function formatPKR(
  amount: number,
  options?: { compact?: boolean; showCurrency?: boolean; sign?: boolean }
): string {
  const { compact = false, showCurrency = true, sign = false } = options ?? {};
  const abs = Math.abs(amount);
  const formatted = compact
    ? new Intl.NumberFormat("en-PK", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(abs)
    : new Intl.NumberFormat("en-PK", {
        maximumFractionDigits: 0,
      }).format(Math.round(abs));

  const prefix = sign ? (amount > 0 ? "+" : amount < 0 ? "-" : "") : amount < 0 ? "-" : "";
  return showCurrency ? `${prefix}PKR ${formatted}` : `${prefix}${formatted}`;
}

export function computeWeightedAverageCost(
  currentQty: number,
  currentAvgCost: number,
  incomingQty: number,
  incomingUnitCost: number
): number {
  const totalQty = currentQty + incomingQty;
  if (totalQty <= 0) return Math.round(incomingUnitCost);
  const totalPaisa =
    Math.round(currentQty * currentAvgCost * 100) +
    Math.round(incomingQty * incomingUnitCost * 100);
  return Math.round(totalPaisa / totalQty) / 100;
}
