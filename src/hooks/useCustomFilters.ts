import { useState } from 'react';

import type { CustomFilter } from '../models/ccpLogParser';
import { getLocalStorage, setLocalStorage } from '../utils/localStorage';

const FILTERS_KEY = 'custom-filters';
const ACTIVE_FILTER_KEY = 'active-filter-id';

/**
 * Hook providing CRUD operations for custom log text prefix filters.
 * Filters are persisted to localStorage and survive page reloads.
 *
 * @returns Object with filters array, active filter ID, and CRUD methods.
 */
export const useCustomFilters = () => {
  const [filters, setFilters] = useState<CustomFilter[]>(
    () => (getLocalStorage(FILTERS_KEY) as CustomFilter[] | null) ?? [],
  );
  // eslint-disable-next-line @eslint-react/use-state -- intentionally named differently; wrapped by setActiveFilterId below
  const [activeFilterId, setActiveFilterIdState] = useState<null | string>(
    () => getLocalStorage(ACTIVE_FILTER_KEY) as null | string,
  );

  const persist = (next: CustomFilter[]): void => {
    setFilters(next);
    setLocalStorage(FILTERS_KEY, next);
  };

  const setActiveFilterId = (id: null | string): void => {
    setActiveFilterIdState(id);
    if (id === null) {
      setLocalStorage(ACTIVE_FILTER_KEY, null);
    } else {
      setLocalStorage(ACTIVE_FILTER_KEY, id);
    }
  };

  const addFilter = (label: string, prefix: string): void => {
    const newFilter: CustomFilter = { id: crypto.randomUUID(), label, prefix };
    persist([...filters, newFilter]);
  };

  const removeFilter = (id: string): void => {
    persist(filters.filter((f) => f.id !== id));
    if (activeFilterId === id) {
      setActiveFilterId(null);
    }
  };

  const updateFilter = (id: string, updates: Partial<Pick<CustomFilter, 'label' | 'prefix'>>): void => {
    persist(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const activeFilter = filters.find((f) => f.id === activeFilterId) ?? null;

  return {
    activeFilter,
    activeFilterId,
    addFilter,
    filters,
    removeFilter,
    setActiveFilterId,
    updateFilter,
  };
};
