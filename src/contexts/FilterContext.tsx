import { createContext, use, useState, type FC, type PropsWithChildren } from 'react';

import type { CustomFilter } from '../models/ccpLogParser';
import { useCustomFilters } from '../hooks/useCustomFilters';

interface FilterContextValue {
  /** Add a new custom filter. */
  addFilter: (label: string, prefix: string) => void;
  /** Close the filter manager dialog. */
  closeFilterManager: () => void;
  /** Whether the filter manager dialog is open. */
  filterManagerOpen: boolean;
  /** All custom filters. */
  filters: CustomFilter[];
  /** Open the filter manager dialog. */
  openFilterManager: () => void;
  /** Remove a custom filter by id. */
  removeFilter: (id: string) => void;
  /** Update a custom filter by id. */
  updateFilter: (id: string, updates: Partial<Pick<CustomFilter, 'label' | 'prefix'>>) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

/**
 * Provides custom filter CRUD operations and filter manager dialog state
 * to the component tree via React context.
 *
 * @param root0 Component props.
 * @param root0.children Child components.
 * @returns Context provider wrapping children.
 */
export const FilterProvider: FC<PropsWithChildren> = ({ children }) => {
  const { addFilter, filters, removeFilter, updateFilter } = useCustomFilters();
  const [filterManagerOpen, setFilterManagerOpen] = useState(false);

  return (
    <FilterContext
      value={{
        addFilter,
        closeFilterManager: () => setFilterManagerOpen(false),
        filterManagerOpen,
        filters,
        openFilterManager: () => setFilterManagerOpen(true),
        removeFilter,
        updateFilter,
      }}
    >
      {children}
    </FilterContext>
  );
};

/**
 * Consumes the FilterContext. Must be used within a FilterProvider.
 *
 * @returns The filter context value.
 * @throws {Error} If used outside a FilterProvider.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useFilterContext = (): FilterContextValue => {
  const ctx = use(FilterContext);
  if (!ctx) throw new Error('useFilterContext must be used within a FilterProvider');
  return ctx;
};
