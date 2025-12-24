/**
 * Refactored Explore Screen using reusable components
 * Clean, maintainable, and easily extensible
 */

import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { Chip } from 'react-native-paper'
import { BlurView } from 'expo-blur'
import { MotiView } from 'moti'
import { Skeleton } from 'moti/skeleton'
import * as Haptics from 'expo-haptics'

import { useListings } from '@/hooks/useListings'
import { useFavorites } from '@/hooks/useFavorites'
import { ListingCard } from '@/components/listings/ListingCard'
import { ListingDetailModal } from '@/components/listings/ListingDetailModal'
import { FilterModal } from '@/components/filters/FilterModal'
import { Listing } from '@/types/listing.types'

export default function ExploreScreen() {
  const [showFilters, setShowFilters] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'deal-score'>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('list')
  
  const {
    listings,
    loading,
    loadingMore,
    error,
    totalCount,
    filters,
    filterOptions,
    setFilters,
    clearFilters,
    loadMore,
    refresh
  } = useListings({ pageSize: 50 })
  
  const { isFavorite, toggleFavorite } = useFavorites()
  
  const handleListingPress = (listing: Listing) => {
    setSelectedListing(listing)
    setShowDetailModal(true)
  }
  
  const handleCloseModal = () => {
    setShowDetailModal(false)
    setSelectedListing(null)
  }

  const handleSearch = () => {
    setFilters({ ...filters, search: searchQuery })
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setFilters({ ...filters, search: '' })
  }

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(
      ([key, value]) => key !== 'source' && value !== '' && value !== 'all'
    ).length
  }, [filters])

  const sortedListings = useMemo(() => {
    const sorted = [...listings]
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => (a.price_numeric || 0) - (b.price_numeric || 0))
      case 'price-high':
        return sorted.sort((a, b) => (b.price_numeric || 0) - (a.price_numeric || 0))
      case 'deal-score':
        return sorted.sort((a, b) => (b.deal_score || 0) - (a.deal_score || 0))
      case 'newest':
      default:
        return sorted
    }
  }, [listings, sortBy])

  const bestDeals = useMemo(() => {
    return [...listings]
      .filter(l => l.deal_score && l.deal_score > 0)
      .sort((a, b) => (b.deal_score || 0) - (a.deal_score || 0))
      .slice(0, 5)
  }, [listings])

  const getSortLabel = () => {
    switch (sortBy) {
      case 'price-low': return 'Price: Low to High'
      case 'price-high': return 'Price: High to Low'
      case 'deal-score': return 'Best Deals'
      case 'newest': return 'Newest First'
      default: return 'Sort'
    }
  }

  const renderListing = ({ item, index }: { item: Listing; index: number }) => (
    <View style={layoutMode === 'grid' ? styles.gridItem : undefined}>
      <ListingCard
        listing={item}
        index={index}
        onPress={handleListingPress}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite(item)}
        showSource
        compact={layoutMode === 'grid'}
      />
    </View>
  )

  const ListHeaderComponent = () => (
    <>
      {/* Best Deals Carousel */}
      {bestDeals.length > 0 && (
        <View style={styles.bestDealsSection}>
          <View style={styles.bestDealsHeader}>
            <Ionicons name="star" size={20} color="#667eea" />
            <Text style={styles.bestDealsTitle}>Best Deals</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
          >
            {bestDeals.map((listing, index) => (
              <View key={`${listing.source}-${listing.id}`} style={styles.carouselCard}>
                <ListingCard
                  listing={listing}
                  index={index}
                  onPress={handleListingPress}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite(listing)}
                  showSource={false}
                  compact
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {activeFilterCount > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -20 }}
        >
          <BlurView intensity={80} tint="light" style={styles.activeFiltersBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.activeFiltersContent}>
                <Text style={styles.activeFiltersLabel}>Filters:</Text>
                {renderActiveFilterChips()}
                <Chip
                  icon="close-circle"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                    clearFilters()
                  }}
                  style={styles.clearChip}
                  textStyle={styles.clearChipText}
                >
                  Clear All
                </Chip>
              </View>
            </ScrollView>
          </BlurView>
        </MotiView>
      )}
    </>
  )

  const renderActiveFilterChips = () => {
    const chips: React.ReactElement[] = []
    
    if (filters.source !== 'all') {
      chips.push(
        <Chip
          key="source"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, source: 'all' })}
        >
          {filters.source.toUpperCase()}
        </Chip>
      )
    }
    
    if (filters.priceMin) {
      chips.push(
        <Chip
          key="priceMin"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, priceMin: '' })}
        >
          Min: {filters.priceMin} KM
        </Chip>
      )
    }
    
    if (filters.priceMax) {
      chips.push(
        <Chip
          key="priceMax"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, priceMax: '' })}
        >
          Max: {filters.priceMax} KM
        </Chip>
      )
    }
    
    if (filters.municipality) {
      chips.push(
        <Chip
          key="municipality"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, municipality: '' })}
        >
          {filters.municipality}
        </Chip>
      )
    }
    
    if (filters.adType) {
      chips.push(
        <Chip
          key="adType"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, adType: '' })}
        >
          {filters.adType}
        </Chip>
      )
    }
    
    if (filters.roomsMin) {
      chips.push(
        <Chip
          key="roomsMin"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, roomsMin: '' })}
        >
          {filters.roomsMin}+ rooms
        </Chip>
      )
    }
    
    if (filters.roomsMax) {
      chips.push(
        <Chip
          key="roomsMax"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, roomsMax: '' })}
        >
          ≤{filters.roomsMax} rooms
        </Chip>
      )
    }
    
    if (filters.sizeMin) {
      chips.push(
        <Chip
          key="sizeMin"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, sizeMin: '' })}
        >
          {filters.sizeMin}+ m²
        </Chip>
      )
    }
    
    if (filters.sizeMax) {
      chips.push(
        <Chip
          key="sizeMax"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, sizeMax: '' })}
        >
          ≤{filters.sizeMax} m²
        </Chip>
      )
    }
    
    if (filters.dealScoreMin) {
      chips.push(
        <Chip
          key="dealScoreMin"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, dealScoreMin: '' })}
        >
          Score {filters.dealScoreMin}+
        </Chip>
      )
    }
    
    return chips
  }

  const SkeletonCard = () => (
    <MotiView style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <Skeleton colorMode="light" width={120} height={32} />
        <Skeleton colorMode="light" width={60} height={40} radius={12} />
      </View>
      <Skeleton colorMode="light" width="100%" height={44} />
      <View style={{ marginTop: 12, gap: 8 }}>
        <Skeleton colorMode="light" width="80%" height={20} />
        <Skeleton colorMode="light" width="90%" height={20} />
        <Skeleton colorMode="light" width="70%" height={20} />
      </View>
    </MotiView>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Filter/Sort Bar */}
      <BlurView intensity={95} tint="light" style={styles.topBar}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location, title..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.topBarContent}>
          <TouchableOpacity
            style={[styles.topBarButton, activeFilterCount > 0 && styles.topBarButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setShowFilters(true)
            }}
          >
            <Ionicons
              name="filter"
              size={20}
              color={activeFilterCount > 0 ? '#fff' : '#667eea'}
            />
            <Text style={[styles.topBarButtonText, activeFilterCount > 0 && styles.topBarButtonTextActive]}>
              Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>

          <View style={styles.resultCount}>
            <Text style={styles.resultCountText}>{totalCount || 0} results</Text>
          </View>

          <TouchableOpacity
            style={styles.topBarIconButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setLayoutMode(layoutMode === 'list' ? 'grid' : 'list')
            }}
          >
            <Ionicons 
              name={layoutMode === 'list' ? 'grid-outline' : 'list-outline'} 
              size={20} 
              color="#667eea" 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topBarButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setShowSortMenu(!showSortMenu)
            }}
          >
            <Ionicons name="swap-vertical" size={20} color="#667eea" />
            <Text style={styles.topBarButtonText}>{getSortLabel()}</Text>
          </TouchableOpacity>
        </View>

        {/* Sort Menu Dropdown */}
        {showSortMenu && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -10 }}
            style={styles.sortMenu}
          >
            {[
              { id: 'newest', label: 'Newest First', icon: 'time-outline' },
              { id: 'price-low', label: 'Price: Low to High', icon: 'arrow-up' },
              { id: 'price-high', label: 'Price: High to Low', icon: 'arrow-down' },
              { id: 'deal-score', label: 'Best Deals', icon: 'star' }
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.sortOption, sortBy === option.id && styles.sortOptionActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setSortBy(option.id as any)
                  setShowSortMenu(false)
                }}
              >
                <Ionicons
                  name={option.icon as any}
                  size={18}
                  color={sortBy === option.id ? '#667eea' : '#666'}
                />
                <Text style={[styles.sortOptionText, sortBy === option.id && styles.sortOptionTextActive]}>
                  {option.label}
                </Text>
                {sortBy === option.id && (
                  <Ionicons name="checkmark" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </MotiView>
        )}
      </BlurView>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={{ padding: 16, gap: 16, marginTop: 60 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No properties match your filters</Text>
          <TouchableOpacity onPress={clearFilters} style={styles.retryButton}>
            <Text style={styles.retryText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={sortedListings}
          renderItem={renderListing}
          keyExtractor={(item) => `${item.source}-${item.id}`}
          numColumns={layoutMode === 'grid' ? 2 : 1}
          key={layoutMode}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={loading}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={
            loadingMore ? (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.footerLoader}
              >
                <ActivityIndicator size="small" color="#667eea" />
              </MotiView>
            ) : null
          }
        />
      )}



      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        filters={filters}
        filterOptions={filterOptions}
        totalCount={totalCount}
        onClose={() => setShowFilters(false)}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
      />
      
      {/* Listing Detail Modal */}
      <ListingDetailModal
        visible={showDetailModal}
        listing={selectedListing}
        onClose={handleCloseModal}
        onToggleFavorite={toggleFavorite}
        isFavorite={selectedListing ? isFavorite(selectedListing) : false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  topBar: {
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'rgba(255, 255, 255, 0.95)'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0
  },
  clearSearchButton: {
    padding: 4
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12
  },
  topBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#667eea',
    backgroundColor: '#fff'
  },
  topBarIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#667eea',
    backgroundColor: '#fff'
  },
  topBarButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea'
  },
  topBarButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea'
  },
  topBarButtonTextActive: {
    color: '#fff'
  },
  resultCount: {
    flex: 1,
    alignItems: 'center'
  },
  resultCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666'
  },
  sortMenu: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  sortOptionActive: {
    backgroundColor: '#f5f5ff'
  },
  sortOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#333'
  },
  sortOptionTextActive: {
    fontWeight: '600',
    color: '#667eea'
  },
  activeFiltersBar: {
    paddingVertical: 12,
    overflow: 'hidden',
    marginBottom: 8,
    marginTop: 8
  },
  activeFiltersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8
  },
  activeFiltersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8
  },
  filterChip: {
    backgroundColor: '#667eea',
    marginRight: 8
  },
  filterChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  clearChip: {
    backgroundColor: '#ef4444'
  },
  clearChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  listContent: {
    padding: 16
  },
  gridItem: {
    flex: 1,
    margin: 4,
    maxWidth: '48%'
  },
  bestDealsSection: {
    marginBottom: 16
  },
  bestDealsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12
  },
  bestDealsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a'
  },
  carouselContent: {
    paddingHorizontal: 12,
    gap: 12
  },
  carouselCard: {
    width: 280
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 2
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
