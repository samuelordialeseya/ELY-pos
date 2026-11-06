import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Timer-safe toast notification hook.
 * Prevents overlapping setTimeout calls from prematurely clearing newer messages.
 */
export function useToast(durationMs = 2200) {
  const [toast, setToast] = useState("");
  const timerRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast(msg);
    timerRef.current = setTimeout(() => {
      setToast("");
      timerRef.current = null;
    }, durationMs);
  }, [durationMs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { toast, showToast };
}
