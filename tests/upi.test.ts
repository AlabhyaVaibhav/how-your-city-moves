import { describe, expect, it } from "vitest";
import { upiLink } from "../src/lib/upi";

describe("upiLink", () => {
  it("builds an NPCI pay link with the VPA unencoded", () => {
    expect(upiLink({ id: "alabhya.v@okaxis", name: "Alabhya Vaibhav", amount: 150, note: "Chip in: How Bangalore moves" }))
      .toBe("upi://pay?pa=alabhya.v@okaxis&pn=Alabhya%20Vaibhav&am=150.00&cu=INR&tn=Chip%20in%3A%20How%20Bangalore%20moves");
  });
  it("rejects anything that isn't a UPI ID", () => {
    expect(() => upiLink({ id: "evil&pa=x@y", name: "x", amount: 50, note: "" })).toThrow();
    expect(() => upiLink({ id: "no-at-sign", name: "x", amount: 50, note: "" })).toThrow();
  });
});
