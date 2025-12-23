/**
 * Custom hook for managing listings data
 * Handles fetching, filtering, and pagination
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Listing, ListingFilters, FilterOptions, ListingsParams } from '@/types/listing.types'
import { getListingsV2, getFilterOptions } from '@/services/api'

interface UseListingsOptions {
  initialFilters?: Partial<ListingFilters>
  pageSize?: number
}

export const useListings = (options: UseListingsOptions = {}) => {
  const { initialFilters = {}, pageSize = 50 } = options

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    municipalities: [],
    property_types: [],
    ad_types: [],
    price_range: { min: 0, max: 1000000, step: 10000 },
    rooms_range: { min: 0, max: 10, step: 0.5 },
    size_range: { min: 0, max: 500, step: 10 }
  })

  const [filters, setFilters] = useState<ListingFilters>({
    source: 'all',
    search: '',
    priceMin: '',
    priceMax: '',
    municipality: '',
    propertyType: '',
    adType: '',
    roomsMin: '',
    roomsMax: '',
    sizeMin: '',
    sizeMax: '',
    condition: '',
    dealScoreMin: '',
    ...initialFilters
  })

  const filtersRef = useRef(filters)

  const loadFilterOptions = useCallback(async () => {
    try {
      const result = await getFilterOptions()
      if (result.success) {
        setFilterOptions(result.filters)
      }
    } catch (err) {
      console.error('Failed to load filter options:', err)
    }
  }, [])

  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)
  const offsetRef = useRef(0)

  const fetchListings = useCallback(async (reset: boolean = false) => {
    if (reset) {
      setLoading(true)
      setOffset(0)
      setHasMore(true)
      hasMoreRef.current = true
      offsetRef.current = 0
    } else {
      if (!hasMoreRef.current || loadingMoreRef.current) return
      setLoadingMore(true)
      loadingMoreRef.current = true
    }

    setError('')

    try {
      const currentOffset = reset ? 0 : offsetRef.current

      // Build query parameters
      const currentFilters = filtersRef.current

      const params: ListingsParams = {
        limit: pageSize,
        offset: currentOffset,
        source: currentFilters.source
      }

      if (currentFilters.search) params.search = currentFilters.search
      if (currentFilters.priceMin) params.price_min = Number(currentFilters.priceMin)
      if (currentFilters.priceMax) params.price_max = Number(currentFilters.priceMax)
      if (currentFilters.municipality) params.municipality = currentFilters.municipality
      if (currentFilters.propertyType) params.property_type = currentFilters.propertyType
      if (currentFilters.adType) params.ad_type = currentFilters.adType
      if (currentFilters.roomsMin) params.rooms_min = Number(currentFilters.roomsMin)
      if (currentFilters.roomsMax) params.rooms_max = Number(currentFilters.roomsMax)
      if (currentFilters.sizeMin) params.size_min = Number(currentFilters.sizeMin)
      if (currentFilters.sizeMax) params.size_max = Number(currentFilters.sizeMax)
      if (currentFilters.dealScoreMin) params.deal_score_min = Number(currentFilters.dealScoreMin)

      const result = await getListingsV2(params)

      if (!result.success) {
        throw new Error('Failed to fetch listings')
      }

      const data = result.data || []
      const total = typeof result.total === 'number' ? result.total : undefined

      setTotalCount(total ?? data.length)

      if (reset) {
        setListings(data)
      } else {
        setListings(prev => [...prev, ...data])
      }

      const nextOffset = currentOffset + data.length
      offsetRef.current = nextOffset
      setOffset(nextOffset)

      const moreAvailable = data.length === pageSize && (total === undefined
        ? true
        : nextOffset < total)
      hasMoreRef.current = moreAvailable
      setHasMore(moreAvailable)
    } catch (err) {
      console.error(err)
      setError('Failed to load listings')
    } finally {
      setLoading(false)
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, [pageSize])

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  // Fetch listings when filters change
  useEffect(() => {
    filtersRef.current = filters
    fetchListings(true)
  }, [fetchListings, filters])

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchListings(false)
    }
  }, [fetchListings, hasMore, loadingMore])

  const refresh = useCallback(() => {
    fetchListings(true)
  }, [fetchListings])

  const clearFilters = useCallback(() => {
    setFilters({
      source: 'all',
      search: '',
      priceMin: '',
      priceMax: '',
      municipality: '',
      propertyType: '',
      adType: '',
      roomsMin: '',
      roomsMax: '',
      sizeMin: '',
      sizeMax: '',
      condition: '',
      dealScoreMin: ''
    })
  }, [])

  const updateFilters = useCallback((newFilters: Partial<ListingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  return {
    listings,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    filters,
    filterOptions,
    setFilters,
    updateFilters,
    clearFilters,
    loadMore,
    refresh
  }
}
