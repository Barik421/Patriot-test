import { readStorage, writeStorage } from "./storage";
type EventName =
  | "quiz_start"
  | "quiz_question_view"
  | "quiz_complete"
  | "quiz_result"
  | "quiz_restart"
  | "result_share"
  | "result_download"
  | "theme_change";
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
const id = import.meta.env?.VITE_GA_MEASUREMENT_ID || "";
const containerId = import.meta.env?.VITE_GTM_CONTAINER_ID || "";
const useGtm = /^GTM-[A-Z0-9]+$/.test(containerId);
let loaded = false;
export function analyticsAvailable() {
  return useGtm || /^G-[A-Z0-9]+$/.test(id);
}
export function consent() {
  return readStorage("consent");
}
export function initializeAnalytics() {
  if (
    typeof window === "undefined" ||
    !analyticsAvailable() ||
    consent() !== "granted" ||
    loaded
  )
    return;
  loaded = true;
  window.dataLayer ??= [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  if (useGtm) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.id = "patriot-gtm";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
    document.head.append(script);
    return;
  }
  window.gtag("js", new Date());
  window.gtag("config", id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  // Never send quiz answers, session IDs or the URL containing a shared result.
  const script = document.createElement("script");
  script.id = "patriot-ga";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.append(script);
}
export function setConsent(allowed: boolean) {
  writeStorage("consent", allowed ? "granted" : "denied");
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = !allowed;
  if (allowed) {
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
    initializeAnalytics();
  } else {
    window.gtag?.("consent", "update", { analytics_storage: "denied" });
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (name === "_ga" || name.startsWith("_ga_")) {
        const host = location.hostname.split(".");
        for (let i = 0; i < host.length; i++)
          document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${host.slice(i).join(".")}; SameSite=Lax`;
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      }
    });
    // Reload to unload container tags when permission is withdrawn.
    if (useGtm && loaded) window.location.reload();
  }
}
export function track(
  name: EventName,
  params: Record<string, string | number> = {},
) {
  if (
    typeof window === "undefined" ||
    consent() !== "granted" ||
    !analyticsAvailable()
  )
    return;
  initializeAnalytics();
  const safeParams = {
    ...params,
    page_location: `${location.origin}${import.meta.env?.BASE_URL || "/"}`,
    page_title: "Тест на патріота",
  };
  if (useGtm) window.dataLayer?.push({ event: name, ...safeParams });
  else window.gtag?.("event", name, safeParams);
}
