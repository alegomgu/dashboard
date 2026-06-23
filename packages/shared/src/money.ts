import Decimal from "decimal.js";

export type Money = {
  readonly currency: "USD";
  readonly value: string;
};

export function usd(value: string | number | Decimal): Money {
  return {
    currency: "USD",
    value: new Decimal(value).toFixed(2),
  };
}

export function addMoney(left: Money, right: Money): Money {
  return usd(new Decimal(left.value).add(right.value));
}

export function percentage(numerator: string, denominator: string): string {
  const base = new Decimal(denominator);
  if (base.isZero()) {
    return "0.00";
  }

  return new Decimal(numerator).div(base).mul(100).toFixed(2);
}
