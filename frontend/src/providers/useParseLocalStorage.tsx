import { useState } from "react";

type LocalStorageSetterFunction<T> = {
  description?: string;
  (currentValue: Array<T> | object): Array<T> | object;
};

export function useParseLocalStorage<T = string>(
  key: string,
  defaultValue?: Array<T> | object
): [
  string | undefined,
  (valueOrFn: Array<T> | object | LocalStorageSetterFunction<T>) => void
] {
  const [localStorageValue, setLocalStorageValue] = useState(() => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        return JSON.parse(value);
      } else if (defaultValue) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      } else {
        return undefined;
      }
    } catch{
      return undefined;
    }
  });

  const setLocalStorageStateValue = (
    valueOrFn: Array<T> | object | LocalStorageSetterFunction<T>
  ) => {
    let newValue: object;
    if (typeof valueOrFn === "object") {
      newValue = valueOrFn;
    } else {
      const fn = valueOrFn;
      newValue = fn(localStorageValue);
    }

    localStorage.setItem(key, JSON.stringify(newValue));
    setLocalStorageValue(newValue);
  };
  return [localStorageValue, setLocalStorageStateValue];
}