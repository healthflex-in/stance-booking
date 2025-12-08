'use client'

import React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

import { useDebounce } from './useDebounce'
import { PaginationDirection, UserSortField, SortOrder, AdvanceSortField, InvoiceSortField } from '@/gql/graphql'

// Reserved URL parameter names that are not considered filters
const RESERVED_PARAMS = new Set([
  'search',
  'pageSize',
  'cursor',
  'direction',
  'sortField',
  'sortOrder'
] as const)

// sort across the app pages
export type AppSort = UserSortField | AdvanceSortField | InvoiceSortField;

// Configuration interface for the hook
interface PaginationConfig<T extends AppSort = AppSort> {
  /** Debounce delay for search in milliseconds */
  debounceMs?: number
  /** Default number of items per page */
  defaultPageSize?: number
  /** Default sort order */
  defaultSortOrder?: SortOrder
  /** Default sort field */
  defaultSortField?: T
  /** Maximum allowed page size */
  maxPageSize?: number
  /** Minimum allowed page size */
  minPageSize?: number
}

// State interface representing the current pagination state
interface PaginationState {
  /** Current search term */
  search: string
  /** Debounced search term for immediate UI feedback */
  debouncedSearch?: string
  /** Number of items per page */
  pageSize: number
  /** Current cursor for pagination */
  cursor: string | null
  /** Current sort order */
  sortOrder: SortOrder
  /** Current sort field */
  sortField: AppSort
  /** Current pagination direction */
  direction: PaginationDirection
  /** Additional filters as key-value pairs */
  filters: Record<string, string>
}

// Actions interface for updating pagination state
interface PaginationActions {
  /** Reset all parameters to defaults */
  reset: () => void
  /** Navigate to next page with given cursor */
  goNext: (cursor: string) => void
  /** Navigate to previous page with given cursor */
  goPrevious: (cursor: string) => void
  /** Update search term */
  setSearch: (search: string) => void
  /** Update page size */
  setPageSize: (size: number) => void
  /** Update a single filter */
  setFilter: (key: string, value: string) => void
  /** Update multiple filters at once */
  setFilters: (filters: Record<string, string>) => void
  /** Update URL with partial state changes */
  updateUrl: (params: Partial<PaginationState>) => void
  /** Update sort field and order */
  setSort: (field: AppSort, order: SortOrder) => void
}

/**
 * Validates and constrains page size within acceptable bounds
 */
function validatePageSize(
  size: number,
  min: number = 1,
  max: number = 1000
): number {
  if (isNaN(size) || size < min) return min
  if (size > max) return max
  return Math.floor(size)
}

/**
 * Safely parses enum values with fallback
 */
function parseEnumValue<T extends Record<string, string>>(
  value: string | null,
  enumObject: T,
  defaultValue: T[keyof T]
): T[keyof T] {
  if (!value) return defaultValue

  const enumValues = Object.values(enumObject)
  return enumValues.includes(value as T[keyof T])
    ? (value as T[keyof T])
    : defaultValue
}

/**
 * Main URL pagination hook that syncs pagination state with URL parameters
 */
export function useUrlPagination(config: PaginationConfig = {}): [PaginationState, PaginationActions] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const {
    minPageSize = 1,
    maxPageSize = 1000,
    defaultPageSize = 20,
    defaultSortOrder = SortOrder.Desc,
    defaultSortField = UserSortField.CreatedAt,
  } = config

  // Get stable string representation for dependencies
  const searchParamsString = searchParams?.toString() || ''
  
  // Parse current state from URL parameters
  const currentState = React.useMemo((): PaginationState => {
    if (!searchParams) {
      return {
        search: '',
        filters: {},
        cursor: null,
        pageSize: defaultPageSize,
        sortField: defaultSortField,
        sortOrder: defaultSortOrder,
        direction: PaginationDirection.Forward,
      }
    }

    const params = new URLSearchParams(searchParamsString)

    // Extract filters (non-reserved parameters)
    const filters: Record<string, string> = {}
    for (const [key, value] of params.entries()) {
      if (!RESERVED_PARAMS.has(key as any) && value?.trim()) {
        filters[key] = value.trim()
      }
    }

    // Parse and validate parameters
    const rawPageSize = params.get('pageSize')
    const pageSize = validatePageSize(
      rawPageSize ? parseInt(rawPageSize, 10) : defaultPageSize,
      minPageSize,
      maxPageSize
    )

    const sortOrder = parseEnumValue(
      params.get('sortOrder'),
      SortOrder,
      defaultSortOrder
    )

    // Parse sort field without nested useMemo
    const rawSortField = params.get('sortField')
    const enumType = (defaultSortField as any)?.constructor ?? UserSortField
    const sortField = parseEnumValue(
      rawSortField,
      enumType,
      defaultSortField
    ) as AppSort

    const direction = parseEnumValue(
      params.get('direction'),
      PaginationDirection,
      PaginationDirection.Forward
    )

    return {
      filters,
      pageSize,
      sortOrder,
      direction,
      sortField,
      search: params.get('search')?.trim() || '',
      cursor: params.get('cursor')?.trim() || null,
    }
  }, [
    searchParamsString,
    defaultPageSize,
    defaultSortField,
    defaultSortOrder,
    maxPageSize,
    minPageSize,
  ])

  // Update URL with new parameters
  const updateUrl = React.useCallback((newParams: Partial<PaginationState>) => {
    if (!searchParams || !router || !pathname) {
      console.warn('URL pagination: Required Next.js hooks not available')
      return
    }

    try {
      const params = new URLSearchParams(searchParams.toString())

      // Process each parameter update
      Object.entries(newParams).forEach(([key, value]) => {
        if (key === 'filters' && value && typeof value === 'object') {
          // Clear existing filter parameters
          for (const [paramKey] of Array.from(params.entries())) {
            if (!RESERVED_PARAMS.has(paramKey as any)) {
              params.delete(paramKey)
            }
          }

          // Add new filter parameters
          Object.entries(value as Record<string, string>).forEach(([filterKey, filterValue]) => {
            const trimmedValue = filterValue?.toString().trim()
            if (trimmedValue) {
              params.set(filterKey, trimmedValue)
            }
          })
        } else {
          // Handle regular parameters
          const stringValue = value?.toString().trim()
          if (stringValue) {
            params.set(key, stringValue)
          } else {
            params.delete(key)
          }
        }
      })

      // Clear cursor when non-navigation parameters change
      const isNavigationChange =
        newParams.cursor !== undefined ||
        newParams.direction !== undefined

      // Always clear cursor and reset direction when page size, search, or filters change
      const shouldResetPagination = 
        newParams.pageSize !== undefined ||
        newParams.search !== undefined ||
        newParams.filters !== undefined ||
        Object.keys(newParams).some(key => !RESERVED_PARAMS.has(key as any))

      if (!isNavigationChange || shouldResetPagination) {
        params.delete('cursor')
        params.set('direction', PaginationDirection.Forward)
      }

      // Validate page size if it's being updated
      if (newParams.pageSize !== undefined) {
        const validatedSize = validatePageSize(newParams.pageSize, minPageSize, maxPageSize)
        params.set('pageSize', validatedSize.toString())
        // Always reset cursor when page size changes
        params.delete('cursor')
        params.set('direction', PaginationDirection.Forward)
      }

      // Update URL
      const queryString = params.toString()
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname

      router.replace(newUrl, { scroll: false })
    } catch (error) {
      console.error('Error updating URL in pagination hook:', error)
    }
  }, [pathname, router, searchParams, maxPageSize, minPageSize])

  // Memoized action creators
  const actions: PaginationActions = React.useMemo(() => ({
    setSearch: (search: string) => {
      updateUrl({ search: search?.trim() || '' })
    },

    setPageSize: (pageSize: number) => {
      const validatedSize = validatePageSize(pageSize, minPageSize, maxPageSize)
      // Reset cursor when changing page size to avoid pagination issues
      updateUrl({ 
        pageSize: validatedSize,
        cursor: null,
        direction: PaginationDirection.Forward
      })
    },

    setSort: (sortField: AppSort, sortOrder: SortOrder) => {
      updateUrl({ sortField, sortOrder })
    },

    setFilter: (key: string, value: string) => {
      if (!key?.trim()) {
        console.warn('Filter key cannot be empty')
        return
      }

      const newFilters = { ...currentState.filters }
      const trimmedValue = value?.trim()

      if (trimmedValue) {
        newFilters[key.trim()] = trimmedValue
      } else {
        delete newFilters[key.trim()]
      }

      updateUrl({ filters: newFilters })
    },

    setFilters: (filters: Record<string, string>) => {
      const cleanFilters: Record<string, string> = {}

      Object.entries(filters || {}).forEach(([key, value]) => {
        const trimmedKey = key?.trim()
        const trimmedValue = value?.trim()

        if (trimmedKey && trimmedValue) {
          cleanFilters[trimmedKey] = trimmedValue
        }
      })

      updateUrl({ filters: cleanFilters })
    },

    goNext: (cursor: string) => {
      if (!cursor?.trim()) {
        console.warn('Next cursor cannot be empty')
        return
      }
      updateUrl({ cursor: cursor.trim(), direction: PaginationDirection.Forward })
    },

    goPrevious: (cursor: string) => {
      if (!cursor?.trim()) {
        console.warn('Previous cursor cannot be empty')
        return
      }
      updateUrl({ cursor: cursor.trim(), direction: PaginationDirection.Backward })
    },

    reset: () => {
      try {
        router.replace(pathname, { scroll: false })
      } catch (error) {
        console.error('Error resetting pagination:', error)
      }
    },

    updateUrl,
  }), [
    router,
    pathname,
    updateUrl,
    maxPageSize,
    minPageSize,
    currentState.filters,
  ])

  return [currentState, actions]
}

/**
 * Enhanced hook with debounced search functionality
 */
export function useUrlPaginationWithDebounce(config: PaginationConfig = {}): [PaginationState, PaginationActions] {
  const [state, actions] = useUrlPagination(config)

  // Internal state for immediate UI updates
  const [internalSearch, setInternalSearch] = React.useState(state.search)

  // Debounced search value
  const debouncedSearch = useDebounce(internalSearch, config.debounceMs || 500)

  // Sync debounced search with URL
  React.useEffect(() => {
    if (debouncedSearch !== state.search) {
      actions.setSearch(debouncedSearch)
    }
  }, [debouncedSearch])

  // Sync URL changes back to internal search (for browser navigation)
  React.useEffect(() => {
    setInternalSearch(state.search)
  }, [state.search])

  // Enhanced actions with debounced search
  const enhancedActions: PaginationActions = React.useMemo(() => ({
    ...actions,
    setSearch: (search: string) => {
      setInternalSearch(search || '')
    },
  }), [actions])

  // Return state with internal search for immediate UI feedback
  const enhancedState: PaginationState = React.useMemo(() => ({
    ...state,
    search: internalSearch,
    debouncedSearch: debouncedSearch
  }), [state, internalSearch])

  return [enhancedState, enhancedActions]
}

/**
 * Type-safe filter helpers for working with strongly-typed filters
 */
export function createFilterHelpers<T extends Record<string, string | number | boolean>>() {
  return {
    /**
     * Set a typed filter value
     */
    setTypedFilter: <K extends keyof T>(
      actions: PaginationActions,
      key: K,
      value: T[K] | null | undefined
    ): void => {
      const stringValue = value?.toString().trim() || ''
      actions.setFilter(key as string, stringValue)
    },

    /**
     * Get a typed filter value with optional default
     */
    getTypedFilter: <K extends keyof T>(
      state: PaginationState,
      key: K,
      defaultValue?: T[K]
    ): T[K] | undefined => {
      const rawValue = state.filters[key as string]

      if (!rawValue) {
        return defaultValue
      }

      // Type conversion based on default value type
      if (typeof defaultValue === 'number') {
        const numValue = Number(rawValue)
        return isNaN(numValue) ? defaultValue : (numValue as T[K])
      }

      if (typeof defaultValue === 'boolean') {
        return (rawValue.toLowerCase() === 'true') as T[K]
      }

      // Default to string
      return rawValue as T[K]
    },

    /**
     * Check if a filter has a non-empty value
     */
    hasFilter: <K extends keyof T>(
      state: PaginationState,
      key: K
    ): boolean => {
      const value = state.filters[key as string]
      return Boolean(value?.trim())
    },

    /**
     * Get all active filters (non-empty values)
     */
    getActiveFilters: (state: PaginationState): Partial<T> => {
      const activeFilters: Partial<T> = {}

      Object.entries(state.filters).forEach(([key, value]) => {
        if (value?.trim()) {
          activeFilters[key as keyof T] = value as T[keyof T]
        }
      })

      return activeFilters
    },
  }
}

/**
 * Utility type for extracting filter types from a component
 */
export type FilterType<T> = T extends Record<string, infer U> ? U : never

/**
 * Helper hook for managing loading states during pagination
 */
export function usePaginationLoading() {
  const [isLoading, setIsLoading] = React.useState(false)

  return {
    isLoading,
    withLoading: React.useCallback(async <T>(promise: Promise<T>): Promise<T> => {
      setIsLoading(true)
      try {
        return await promise
      } finally {
        setIsLoading(false)
      }
    }, []),
  }
}