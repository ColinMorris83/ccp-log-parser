import { useState } from 'react';

import type { CustomFilter } from '../models/ccpLogParser';
import { getLocalStorage, setLocalStorage } from '../utils/localStorage';

const FILTERS_KEY = 'custom-filters';

/**
 * Hook providing CRUD operations for custom log text prefix filters.
 * Filters are persisted to localStorage and survive page reloads.
 * Active filter selection is managed per-file, not by this hook.
 *
 * @returns Object with filters array and CRUD methods.
 */
export const useCustomFilters = () => {
  const [filters, setFilters] = useState<CustomFilter[]>(
    () => (getLocalStorage(FILTERS_KEY) as CustomFilter[] | null) ?? [],
  );

  const persist = (next: CustomFilter[]): void => {
    setFilters(next);
    setLocalStorage(FILTERS_KEY, next);
  };

  const addFilter = (label: string, prefix: string): void => {
    const newFilter: CustomFilter = { id: crypto.randomUUID(), label, prefix };
    persist([...filters, newFilter]);
  };

  const removeFilter = (id: string): void => {
    persist(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<Pick<CustomFilter, 'label' | 'prefix'>>): void => {
    persist(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  return {
    addFilter,
    filters,
    removeFilter,
    updateFilter,
  };
};
