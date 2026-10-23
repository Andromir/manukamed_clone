const CONSENT_KEY = 'bs-cookie-consent';
const OPEN_EVENT = 'bs:cookie-settings';

export type Consent = 'granted' | 'denied';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_ID_PATTERN = /^G-[A-Z0-9]{4,15}$/;

export function getConsent(): Consent | null {
  const v = localStorage.getItem(CONSENT_KEY);
  return v === 'granted' || v === 'denied' ? v : null;
}

export function setConsent(value: Consent) {
  localStorage.setItem(CONSENT_KEY, value);
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenCookieSettings(handler: () => void) {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

export function loadAnalytics(measurementId: string) {
  if (!GA_ID_PATTERN.test(measurementId) || window.gtag) return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { anonymize_ip: true });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

export function trackEvent(name: string, params: Record<string, unknown>) {
  window.gtag?.('event', name, params);
}
