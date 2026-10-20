declare global {
  interface Window {
    /** Lightweight analytics hook installed in app/layout.tsx */
    spTrack?: (event: string, data?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }

  interface RazorpayInstance {
    open(): void;
    on(event: string, handler: (payload: Record<string, unknown>) => void): void;
  }
}

export {};
