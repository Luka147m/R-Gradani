import { useState } from "react";

type LocalStorageSetterFunction = {
  description?: string;
  (currentValue: string): string;
};

export function useLocalStorage(
  key: string,
  defaultValue?: string
): [string | undefined, (valueOrFn: string | LocalStorageSetterFunction) => void] {
  const [localStorageValue, setLocalStorageValue] = useState(() => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        if (typeof value === "string") {
          return value;
        } else {
          return JSON.parse(value);
        }
      } else if (defaultValue) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      } else {
        return undefined;
      }
    } catch {
      return undefined;
    }
  });

  const setLocalStorageStateValue = (
    valueOrFn: string | LocalStorageSetterFunction
  ) => {
    let newValue: string;
    if (typeof valueOrFn === "string") {
      newValue = valueOrFn;
    } else {
      const fn = valueOrFn;
      newValue = fn(localStorageValue);
    }

    if (newValue !== "") {
      localStorage.setItem(key, newValue);
    }
    setLocalStorageValue(newValue);
  };
  return [localStorageValue, setLocalStorageStateValue];
}