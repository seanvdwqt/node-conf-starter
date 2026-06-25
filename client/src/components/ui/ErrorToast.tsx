import { useEffect, useState } from 'react';

export interface ErrorToastProps {
  message: string | null;
  /** Auto-dismiss after this many ms. Defaults to 6000. Set to 0 to disable. */
  duration?: number;
  onDismiss: () => void;
}

/**
 * A toast notification that pops over the bottom of the screen.
 * Displays error messages with a dismiss button and auto-dismiss timer.
 */
export function ErrorToast({ message, duration = 6000, onDismiss }: ErrorToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);

      if (duration > 0) {
        const timer = setTimeout(() => {
          setVisible(false);
          setTimeout(onDismiss, 300); // Wait for exit animation
        }, duration);
        return () => clearTimeout(timer);
      }
      return undefined;
    } else {
      setVisible(false);
    }
    return undefined;
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      role="alert"
      aria-live="assertive"
      data-testid="error-toast"
    >
      <div className="flex items-center gap-3 rounded-lg bg-red-600 px-5 py-3 text-white shadow-xl max-w-md">
        <svg
          className="h-5 w-5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="ml-2 flex-shrink-0 rounded p-1 hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Dismiss error"
          data-testid="error-toast-dismiss"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ErrorToast;
