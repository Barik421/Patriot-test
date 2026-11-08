import { afterEach, describe, expect, it, vi } from "vitest";
import { shareResult } from "../src/lib/share";
const result = { category: "patriot" as const, percent: 80, variant: 0 };
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("sharing fallbacks", () => {
  it("uses native sharing when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    vi.stubGlobal("location", { origin: "https://test.invalid" });
    expect(await shareResult(result)).toBe("native");
    expect(share).toHaveBeenCalledOnce();
    expect(share.mock.calls[0][0].url).toContain("#result=patriot&p=80&v=0");
  });
  it("copies when native sharing is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.stubGlobal("location", { origin: "https://test.invalid" });
    expect(await shareResult(result)).toBe("copied");
    expect(writeText).toHaveBeenCalledOnce();
  });
  it("copies when the native share permission is denied", async () => {
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new Error("Denied")),
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    vi.stubGlobal("location", { origin: "https://test.invalid" });
    expect(await shareResult(result)).toBe("copied");
  });
  it("exposes manual selection when clipboard is denied", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) },
    });
    vi.stubGlobal("location", { origin: "https://test.invalid" });
    expect(await shareResult(result)).toBe("manual");
  });
  it("respects cancellation without copying", async () => {
    const writeText = vi.fn();
    vi.stubGlobal("navigator", {
      share: vi
        .fn()
        .mockRejectedValue(new DOMException("Cancelled", "AbortError")),
      clipboard: { writeText },
    });
    vi.stubGlobal("location", { origin: "https://test.invalid" });
    expect(await shareResult(result)).toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });
});
