/**
 * Reusable Filter Modal Component
 * Generic filter interface that works with any source
 */

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { ListingFilters, FilterOptions } from '@/types/listing.types'
import { getSourceFilterOptions } from '@/config/sources.config'

interface FilterModalProps {
  visible: boolean
  filters: ListingFilters
  filterOptions: FilterOptions
  totalCount: number
  onClose: () => void
  onFiltersChange: (filters: ListingFilters) => void
  onClearAll: () => void
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  filterOptions,
  totalCount,
  onClose,
  onFiltersChange,
  onClearAll
}) => {
  const updateFilter = <K extends keyof ListingFilters>(
    key: K,
    value: ListingFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const sourceOptions = getSourceFilterOptions()

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.header}
          >
            <Text style={styles.title}>Filter Properties</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Filter Sections */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Source Filter */}
            <FilterSection title="📦 Data Source">
              <ChipGroup
                options={sourceOptions.map(s => s.value)}
                labels={sourceOptions.map(s => s.label)}
                selected={filters.source}
                onSelect={(value) => updateFilter('source', value as any)}
              />
            </FilterSection>

            {/* Price Range */}
            <FilterSection title="💰 Price Range (KM)">
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  placeholder="Min price"
                  placeholderTextColor="#999"
                  value={filters.priceMin}
                  onChangeText={(text) => updateFilter('priceMin', text)}
                  keyboardType="numeric"
                />
                <Text style={styles.separator}>—</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Max price"
                  placeholderTextColor="#999"
                  value={filters.priceMax}
                  onChangeText={(text) => updateFilter('priceMax', text)}
                  keyboardType="numeric"
                />
              </View>
            </FilterSection>

            {/* Municipality */}
            {filterOptions.municipalities.length > 0 && (
              <FilterSection title="📍 Location">
                <TextInput
                  style={styles.inputFull}
                  placeholder="Search municipality..."
                  placeholderTextColor="#999"
                  value={filters.municipality}
                  onChangeText={(text) => updateFilter('municipality', text)}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <ChipGroup
                    options={filterOptions.municipalities.slice(0, 10)}
                    selected={filters.municipality}
                    onSelect={(value) => updateFilter('municipality', value === filters.municipality ? '' : value)}
                    horizontal
                  />
                </ScrollView>
              </FilterSection>
            )}


            {/* Ad Type */}
            {filterOptions.ad_types.length > 0 && (
              <FilterSection title="📝 Ad Type">
                <ChipGroup
                  options={filterOptions.ad_types}
                  selected={filters.adType}
                  onSelect={(value) => updateFilter('adType', value === filters.adType ? '' : value)}
                />
              </FilterSection>
            )}

            {/* Property Details */}
            <FilterSection title="🛏️ Property Details">
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Min Rooms</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 2"
                    placeholderTextColor="#999"
                    value={filters.roomsMin}
                    onChangeText={(text) => updateFilter('roomsMin', text)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Max Rooms</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 4"
                    placeholderTextColor="#999"
                    value={filters.roomsMax}
                    onChangeText={(text) => updateFilter('roomsMax', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Min Size (m²)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 50"
                    placeholderTextColor="#999"
                    value={filters.sizeMin}
                    onChangeText={(text) => updateFilter('sizeMin', text)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Max Size (m²)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 100"
                    placeholderTextColor="#999"
                    value={filters.sizeMax}
                    onChangeText={(text) => updateFilter('sizeMax', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </FilterSection>

            {/* Deal Score */}
            <FilterSection title="⭐ Deal Score">
              <ChipGroup
                options={['90', '70', '50']}
                labels={['90+ (Excellent)', '70+ (Good)', '50+ (Fair)']}
                selected={filters.dealScoreMin}
                onSelect={(value) => updateFilter('dealScoreMin', value === filters.dealScoreMin ? '' : value)}
              />
            </FilterSection>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={onClose}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.applyButtonGradient}
              >
                <Text style={styles.applyButtonText}>
                  Apply Filters ({totalCount.toLocaleString()})
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// Helper Components

interface FilterSectionProps {
  title: string
  children: React.ReactNode
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
)

interface ChipGroupProps {
  options: string[]
  labels?: string[]
  selected: string
  onSelect: (value: string) => void
  horizontal?: boolean
}

const ChipGroup: React.FC<ChipGroupProps> = ({
  options,
  labels,
  selected,
  onSelect,
  horizontal = false
}) => (
  <View style={horizontal ? styles.chipRowHorizontal : styles.chipRow}>
    {options.map((option, index) => {
      const label = labels?.[index] || option
      const isSelected = selected === option
      return (
        <TouchableOpacity
          key={option}
          style={[styles.chip, isSelected && styles.chipActive]}
          onPress={() => onSelect(option)}
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      )
    })}
  </View>
)

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  body: {
    padding: 20
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  inputFull: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12
  },
  separator: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600'
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chipRowHorizontal: {
    flexDirection: 'row',
    gap: 8
  },
  chip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e9ecef'
  },
  chipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea'
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#fff'
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff'
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  applyButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden'
  },
  applyButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})
