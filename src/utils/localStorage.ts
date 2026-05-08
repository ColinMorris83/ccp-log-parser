const STORAGE_PREFIX = 'ccp-log-parser:';

/**
 * Reads a value from localStorage, parsing it as JSON.
 * Returns null if the key doesn't exist or parsing fails.
 *
 * @param key - Storage key (without prefix).
 * @returns The parsed value, or null.
 */
export const getLocalStorage = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
};

/**
 * Writes a value to localStorage as JSON.
 *
 * @param key - Storage key (without prefix).
 * @param value - The value to store.
 */
export const setLocalStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently ignore
  }
};

/**
 * Removes a value from localStorage.
 *
 * @param key - Storage key (without prefix).
 */
export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // Silently ignore
  }
};
