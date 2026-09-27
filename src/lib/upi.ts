/* UPI deep links (NPCI "upi://pay" format). Opens GPay / PhonePe / Paytm / BHIM with the amount filled in. */
const VPA = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export function upiLink(o: { id: string; name: string; amount: number; note: string }) {
  if (!VPA.test(o.id)) throw new Error(`Not a valid UPI ID: ${o.id}`);
  // the VPA goes in raw: several UPI apps reject "%40" in place of "@"
  const q = [
    ["pa", o.id, true],
    ["pn", o.name],
    ["am", o.amount.toFixed(2)],
    ["cu", "INR"],
    ["tn", o.note],
  ].map(([k, v, raw]) => `${k}=${raw ? v : encodeURIComponent(String(v))}`).join("&");
  return `upi://pay?${q}`;
}
