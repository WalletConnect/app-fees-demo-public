import { useCallback, useState } from "react";

const STORAGE_KEY = "swap-demo:rules-accepted";

/** "I read and accept the Terms of Use and Privacy Policy", persisted in localStorage. */
export function useTermsAccepted(): [boolean, (accepted: boolean) => void] {
  const [accepted, setAcceptedState] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");

  const setAccepted = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    setAcceptedState(value);
  }, []);

  return [accepted, setAccepted];
}
