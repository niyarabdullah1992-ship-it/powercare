export const SUBSCRIPTION_VAT_RATE = 0.15;

export function subscriptionTotals(amount) {
  const subtotal = Math.max(0, Number(amount) || 0);
  const vat = Math.round(subtotal * SUBSCRIPTION_VAT_RATE * 100) / 100;
  return { subtotal, vat, total: Math.round((subtotal + vat) * 100) / 100 };
}

export function formatSubscriptionMoney(amount, currency = "USD", ar = false) {
  return new Intl.NumberFormat(ar ? "ar-SA" : "en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);
}