import { useState, useEffect } from "react";

function useLocalStorageStringArray(
  key: string,
  initialValue: string[] = [],
): [string[], (value: string[] | ((prev: string[]) => string[])) => void] {
  const [state, setState] = useState<string[]>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? (JSON.parse(storedValue) as string[]) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}

export default useLocalStorageStringArray;
