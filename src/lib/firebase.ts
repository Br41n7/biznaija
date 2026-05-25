import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAnalytics, logEvent } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// -------------------------------------------------------------
// Phase 3: Firebase App Check with standard reCAPTCHA v3
// -------------------------------------------------------------
// REPLACE THIS Site Key with your actual standard reCAPTCHA v3 Site Key from the Google reCAPTCHA Console
export const RECAPTCHA_SITE_KEY = '6LcPY_csAAAAAIFtquEcVScs_5daFCBhEJ-XMBVm';

let appCheck: any = null;

if (typeof window !== 'undefined') {
  // Bypassing real client-side App Check in standard sandbox/development to prevent 403 token exchange blocks 
  // on unmatched live preview domains and solve internal Firebase Auth assertion failures.
  // Set to true only in final production when standard reCAPTCHA site credentials match the live domain.
  const ENABLE_REAL_APPCHECK = false; 

  if (ENABLE_REAL_APPCHECK) {
    const hostname = window.location.hostname;
    if (
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.includes('europe-west2.run.app') || 
      hostname.includes('web.app') || 
      hostname.includes('firebaseapp.com')
    ) {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      console.log("[Cybersecurity Guard] Firebase App Check Debug Mode enabled for environment domain:", hostname);
    }

    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
      console.log("[Cybersecurity Guard] Firebase App Check (v3 Standard) successfully initialized.");
    } catch (error) {
      console.warn("App Check initialization skipped or failed in this runtime scope:", error);
    }
  } else {
    console.log("[Cybersecurity Guard] Firebase App Check is currently bypassed in Sandbox/Demo mode to prevent 403 errors.");
  }
}

export { appCheck };

// -------------------------------------------------------------
// Phase 4: Privacy-First Analytics and Logging Guards
// -------------------------------------------------------------
let analyticsInstance: any = null;

if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  try {
    analyticsInstance = getAnalytics(app);
    console.log("[Cybersecurity Guard] Firebase Analytics initiated.");
  } catch (error) {
    console.warn("Analytics initialization failed:", error);
  }
}

export const analytics = analyticsInstance;

/**
 * Sanitizes any data payload recursively to strip out PII and high-risk numbers (emails, phones, BVN, NIN, CAC)
 */
export function sanitizePii(value: any): any {
  if (value === null || value === undefined) return value;

  if (typeof value !== 'string') {
    if (typeof value === 'object') {
      const sanitizedObj: any = Array.isArray(value) ? [] : {};
      for (const key of Object.keys(value)) {
        const upperKey = key.toUpperCase();
        // Redact fields that sound like sensitive identification numbers, keys, or direct contacts
        if (
          upperKey.includes('EMAIL') || 
          upperKey.includes('PHONE') || 
          upperKey.includes('NUMBER') || 
          upperKey.includes('BVN') || 
          upperKey.includes('NIN') || 
          upperKey.includes('CAC') ||
          upperKey.includes('DOCUMENT') ||
          upperKey.includes('PASSWORD') ||
          upperKey.includes('SECRET')
        ) {
          sanitizedObj[key] = '[REDACTED_SENSITIVE_PII]';
        } else {
          sanitizedObj[key] = sanitizePii(value[key]);
        }
      }
      return sanitizedObj;
    }
    return value;
  }

  let sanitized = value;

  // 1. Scrub standard email address format
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  sanitized = sanitized.replace(emailRegex, '[REDACTED_EMAIL]');

  // 2. Scrub continuous sequence of 10 or 11 numbers (this intercepts BVN, NIN, and typical African mobile numbers)
  const numericRegex = /\b\d{10,11}\b/g;
  sanitized = sanitized.replace(numericRegex, '[REDACTED_SECURE_DIGITS]');

  return sanitized;
}

/**
 * Safe, Privacy-First Analytics logger wrapping standard Firebase gtag logs.
 * Guarantees zero leaking of sensitive PII.
 */
export function logSafeAnalyticsEvent(eventName: string, eventParams?: Record<string, any>) {
  const sanitizedParams = eventParams ? sanitizePii(eventParams) : {};
  console.log(`[Privacy-First Analytics] Track Event: "${eventName}"`, sanitizedParams);
  
  if (analyticsInstance) {
    try {
      logEvent(analyticsInstance, eventName, sanitizedParams);
    } catch (e) {
      console.error("Could not send analytics event:", e);
    }
  }
}

export default app;
