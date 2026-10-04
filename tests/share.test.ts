import { describe, expect, it } from "vitest";
import { androidIntent, platform } from "../src/lib/share";

describe("platform", () => {
  it("tells phones from desktops", () => {
    expect(platform("Mozilla/5.0 (Linux; Android 14; Pixel 8)", 5)).toBe("android");
    expect(platform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5)).toBe("ios");
    expect(platform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe("ios"); // iPadOS
    expect(platform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe("other");
    expect(platform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 0)).toBe("other");
  });
});

describe("androidIntent", () => {
  it("opens the X app with the text, falling back to the web page", () => {
    const u = androidIntent("x", "How Pune moves https://x.test/pune", "https://x.com/intent/post?text=hi");
    expect(u).toMatch(/^intent:\/\/post\?message=How%20Pune%20moves/);
    expect(u).toContain("scheme=twitter;package=com.twitter.android;");
    expect(u).toContain("S.browser_fallback_url=" + encodeURIComponent("https://x.com/intent/post?text=hi"));
    expect(u.endsWith(";end")).toBe(true);
  });
  it("opens WhatsApp the same way", () => {
    expect(androidIntent("whatsapp", "hi", "https://wa.me/?text=hi")).toContain("scheme=whatsapp;package=com.whatsapp;");
  });
});
