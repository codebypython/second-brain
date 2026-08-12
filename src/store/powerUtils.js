export function calculateKwh(power, quantity, hours) {
  const p = Number(power);
  const q = Number(quantity);
  const h = Number(hours);
  if (isNaN(p) || isNaN(q) || isNaN(h) || p <= 0 || q <= 0 || h <= 0) {
    return 0;
  }
  return (p * q * h) / 1000;
}

export function calculateFlatCost(kwh, rate, includeVat) {
  const k = Number(kwh);
  const r = Number(rate);
  if (isNaN(k) || isNaN(r) || k <= 0 || r <= 0) {
    return 0;
  }
  const base = k * r;
  return includeVat ? base * 1.1 : base;
}

export function calculateEvnCost(kwh, includeVat) {
  const k = Number(kwh);
  if (isNaN(k) || k <= 0) {
    return 0;
  }
  
  let cost = 0;
  let remaining = k;
  
  const tiers = [
    { limit: 50, rate: 1806 },
    { limit: 50, rate: 1866 },
    { limit: 100, rate: 2167 },
    { limit: 100, rate: 2729 },
    { limit: 100, rate: 3050 },
    { limit: Infinity, rate: 3151 }
  ];
  
  for (const tier of tiers) {
    if (remaining <= 0) break;
    const qty = Math.min(remaining, tier.limit);
    cost += qty * tier.rate;
    remaining -= qty;
  }
  
  return includeVat ? cost * 1.1 : cost;
}
