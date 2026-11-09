import { afterEach, describe, expect, it, vi } from "vitest";
import { readStorage, writeStorage } from "../src/lib/storage";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});
describe("privacy", () => {
  it("continues gracefully when browser storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });
    expect(readStorage("theme")).toBeNull();
    expect(writeStorage("theme", "dark")).toBe(false);
    expect(writeStorage("session", null)).toBe(false);
  });
  it("never loads analytics or sends events before consent, and stops after withdrawal", async () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TEST123");
    const memory = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
      removeItem: (k: string) => memory.delete(k),
    });
    const append = vi.fn();
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      head: { append },
      createElement: () => ({}),
      cookie: "",
    });
    vi.stubGlobal("location", {
      origin: "https://test.invalid",
      hostname: "test.invalid",
    });
    const analytics = await import("../src/lib/analytics");
    analytics.initializeAnalytics();
    analytics.track("quiz_start");
    expect(append).not.toHaveBeenCalled();
    analytics.setConsent(true);
    analytics.track("quiz_start");
    expect(append).toHaveBeenCalledOnce();
    expect(JSON.stringify(window.dataLayer)).toContain("quiz_start");
    analytics.setConsent(false);
    const count = window.dataLayer!.length;
    analytics.track("quiz_complete");
    expect(window.dataLayer).toHaveLength(count);
    analytics.setConsent(true);
    analytics.track("quiz_complete");
    expect(append).toHaveBeenCalledOnce();
    expect(JSON.stringify(window.dataLayer)).toContain("quiz_complete");
  });
  it("loads GTM once after consent, uses dataLayer events and unloads on withdrawal", async () => {
    vi.stubEnv("VITE_GTM_CONTAINER_ID", "GTM-KCNSQ3FH");
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TEST123");
    const memory = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
    });
    const append = vi.fn();
    const reload = vi.fn();
    vi.stubGlobal("window", { location: { reload } });
    vi.stubGlobal("document", {
      head: { append },
      createElement: () => ({}),
      cookie: "",
    });
    vi.stubGlobal("location", {
      origin: "https://patriotest.com.ua",
      hostname: "patriotest.com.ua",
      hash: "#result=private",
      search: "?private=value",
    });
    const analytics = await import("../src/lib/analytics");
    expect(analytics.analyticsAvailable()).toBe(true);
    analytics.initializeAnalytics();
    analytics.setConsent(false);
    analytics.track("quiz_start");
    expect(append).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    analytics.setConsent(true);
    analytics.initializeAnalytics();
    analytics.track("quiz_start");
    expect(append).toHaveBeenCalledOnce();
    expect(append.mock.calls[0][0].src).toBe(
      "https://www.googletagmanager.com/gtm.js?id=GTM-KCNSQ3FH",
    );
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({ event: "gtm.js" }),
    );
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: "quiz_start",
        page_location: "https://patriotest.com.ua/",
      }),
    );
    expect(JSON.stringify(window.dataLayer)).not.toContain("private");
    analytics.setConsent(false);
    expect(reload).toHaveBeenCalledOnce();
    const count = window.dataLayer!.length;
    analytics.track("quiz_complete");
    expect(window.dataLayer).toHaveLength(count);
  });
});
