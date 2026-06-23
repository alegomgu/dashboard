import { describe, expect, it } from "vitest";
import { addMoney, percentage, usd } from "./money";

describe("money helpers", () => {
  it("keeps USD values as fixed decimal strings", () => {
    expect(usd("12.345").value).toBe("12.35");
  });

  it("adds money with decimal arithmetic", () => {
    expect(addMoney(usd("0.10"), usd("0.20")).value).toBe("0.30");
  });

  it("returns zero percent for a zero denominator", () => {
    expect(percentage("10", "0")).toBe("0.00");
  });
});
