'use client';

/** Sends a minimal error report (message, digest, path). Never user input or personal data. */
export function reportClientError(error: Error & { digest?: string }) {
  try {
    const body = JSON.stringify({
      message: String(error.message || 'error').slice(0, 500),
      digest: error.digest?.slice(0, 100),
      path: location.pathname.slice(0, 300),
    });
    if (navigator.sendBeacon)
      navigator.sendBeacon('/api/client-errors', new Blob([body], { type: 'application/json' }));
    else
      void fetch('/api/client-errors', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/json' },
        keepalive: true,
      });
  } catch {
    // never throw from the error reporter
  }
}
