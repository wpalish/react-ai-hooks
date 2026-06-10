import { useState, useEffect, useCallback } from 'react';

type Serializer<T> = {
  read: (raw: string) => T;
  write: (value: T) => string;
};

const jsonSerializer = <T>(): Serializer<T> => ({
  read: (raw) => JSON.parse(raw) as T,
  write: (value) => JSON.stringify(value),
});

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  serializer: Serializer<T> = jsonSerializer<T>()
) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? serializer.read(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, serializer.write(value));
    } catch (err) {
      console.warn('[useLocalStorage] write error', key, err);
    }
  }, [key, value, serializer]);

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setValue(defaultValue);
    } catch {}
  }, [key, defaultValue]);

  return [value, setValue, remove] as const;
}
