import { LinearGradient } from 'expo-linear-gradient'
import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Linking,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MotiView } from 'moti'
import { Searchbar } from 'react-native-paper'
import * as Haptics from 'expo-haptics'
import { searchListings } from '@/services/api'
import { router } from 'expo-router'

interface Listing {
  id: number
  source: 'olx' | 'nekretnine'
  title: string
  price_numeric: number
  municipality: string
  property_type: string
  rooms: number
  square_m2: number
  deal_score: number
  url: string
}

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setHasSearched(true)

    try {
      const result = await searchListings(query, 50)
      if (result.success) {
        setListings(result.data || [])
      } else {
        setError('Search failed')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to search listings')
    } finally {
      setLoading(false)
    }
  }

  const openListing = (url: string) => {
    if (url) {
      Linking.openURL(url)
    }
  }

  const ListingCard = ({ item, index }: { item: Listing; index: number }) => {
    const dealColor = 
      item.deal_score >= 90 ? '#10b981' :
      item.deal_score >= 70 ? '#3b82f6' :
      item.deal_score >= 50 ? '#f59e0b' : '#ef4444'

    const sourceColor = item.source === 'olx' ? '#4A90E2' : '#E2574C'
    const sourceLabel = item.source === 'olx' ? 'OLX' : 'Nekretnine'

    return (
      <MotiView
        from={{ opacity: 0, translateX: -50 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 300, delay: index * 50 }}
      >
        <TouchableOpacity 
          style={styles.card}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            openListing(item.url)
          }}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{item.price_numeric?.toLocaleString() || 'N/A'} KM</Text>
              <Text style={styles.priceEur}>
                ≈ €{((item.price_numeric || 0) / 2).toLocaleString()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={[styles.sourceBadge, { backgroundColor: sourceColor }]}>
                <Text style={styles.sourceText}>{sourceLabel}</Text>
              </View>
              <View style={[styles.dealBadge, { backgroundColor: dealColor }]}>
                <Text style={styles.dealScore}>{item.deal_score}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {item.title || 'No title'}
          </Text>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color="#667eea" />
              <Text style={styles.detailText}>{item.municipality}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="home" size={16} color="#667eea" />
              <Text style={styles.detailText}>
                {item.property_type} • {item.rooms} rooms • {item.square_m2} m²
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Ionicons name="open-outline" size={20} color="#667eea" />
          </View>
        </TouchableOpacity>
      </MotiView>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Properties</Text>
          <View style={{ width: 40 }} />
        </View>

        <Searchbar
          placeholder="Search by location, type, or keywords..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchbar}
          iconColor="#667eea"
          inputStyle={{ fontSize: 16 }}
          placeholderTextColor="#999"
        />

        {hasSearched && (
          <Text style={styles.resultCount}>
            {loading ? 'Searching...' : `${listings.length} results found`}
          </Text>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!hasSearched ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={80} color="#ddd" />
            <Text style={styles.emptyTitle}>Search for Properties</Text>
            <Text style={styles.emptyText}>
              Enter a location, property type, or any keyword to find your ideal property
            </Text>
            
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Try searching for:</Text>
              <View style={styles.suggestions}>
                {['Sarajevo', 'Novo Sarajevo', 'Centar', 'Stan', '3 sobe', 'Renovated'].map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    style={styles.suggestionChip}
                    onPress={() => {
                      setQuery(suggestion)
                      setTimeout(handleSearch, 100)
                    }}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Searching properties...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : listings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={80} color="#ddd" />
            <Text style={styles.emptyTitle}>No Results Found</Text>
            <Text style={styles.emptyText}>
              Try different keywords or check your spelling
            </Text>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            {listings.map((item, index) => (
              <ListingCard key={`${item.source}-${item.id}`} item={item} index={index} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchbar: {
    backgroundColor: '#fff',
    elevation: 4,
    borderRadius: 12,
  },
  resultCount: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  suggestionsContainer: {
    marginTop: 40,
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  suggestionChip: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  suggestionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  priceEur: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dealBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dealScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
})
