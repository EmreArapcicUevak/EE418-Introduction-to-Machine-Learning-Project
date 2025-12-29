/**
 * Detailed Listing Modal
 * Shows all listing information including images in a full-screen modal
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Linking
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import MapView, { Marker } from 'react-native-maps'
import * as Haptics from 'expo-haptics'
import { Listing } from '@/types/listing.types'
import { SourceBadge } from './SourceBadge'
import {
  formatPrice,
  formatRooms,
  formatSquareMeters,
  getDealScoreColor,
  getDealScoreLabel
} from '@/utils/formatting.utils'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface ListingDetailModalProps {
  visible: boolean
  listing: Listing | null
  onClose: () => void
  onToggleFavorite?: (listing: Listing) => void
  isFavorite?: boolean
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  visible,
  listing,
  onClose,
  onToggleFavorite,
  isFavorite = false
}) => {
  const [imageIndex, setImageIndex] = useState(0)

  if (!listing) return null

  const dealColor = getDealScoreColor(listing.deal_score || 0)
  const dealLabel = getDealScoreLabel(listing.deal_score || 0)
  
  // Ensure images is always an array - robust handling
  const images = Array.isArray(listing.image_urls) && listing.image_urls.length > 0
    ? listing.image_urls.filter(url => url && typeof url === 'string')
    : listing.thumbnail_url && typeof listing.thumbnail_url === 'string'
    ? [listing.thumbnail_url] 
    : []

  const handleOpenUrl = () => {
    if (listing.url) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      Linking.openURL(listing.url)
    }
  }

  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onToggleFavorite?.(listing)
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerBadges}>
              {listing.source ? <SourceBadge source={listing.source} size="large" /> : null}
            </View>
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerButton}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={28}
                color={isFavorite ? '#ef4444' : '#fff'}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image Gallery */}
          {images.length > 0 ? (
            <View style={styles.imageSection}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
                  setImageIndex(index)
                }}
              >
                {images.map((imageUrl, index) => (
                  <Image
                    key={index}
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {images.length > 1 ? (
                <BlurView intensity={80} tint="dark" style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {imageIndex + 1} / {images.length}
                  </Text>
                </BlurView>
              ) : null}
            </View>
          ) : (
            <View style={[styles.image, styles.noImage]}>
              <Ionicons name="image-outline" size={64} color="#ccc" />
              <Text style={styles.noImageText}>No images available</Text>
            </View>
          )}

          {/* Modern Price Section */}
          <View style={styles.priceSection}>
            {/* Main Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.price}>
                {listing.price_numeric ? formatPrice(listing.price_numeric) : 'Price on request'}
              </Text>
              <View style={styles.priceDetailsRow}>
                {listing.predicted_price ? (
                  <Text style={styles.predictedPrice}>{listing.predicted_price} KM</Text>
                ) : null}
                {(listing.square_m2 && listing.price_numeric) ? (
                  <>
                    <View style={styles.priceSeparator} />
                    <Text style={styles.pricePerM2}>
                      {Math.round(listing.price_numeric / listing.square_m2)} KM/m²
                    </Text>
                  </>
                ) : null}
              </View>
            </View>

            {/* Deal Score Card */}
            <View style={styles.dealScoreCard}>
              <View style={styles.dealScoreHeader}>
                <Ionicons
                  name={
                    (listing.deal_score || 0) >= 8
                      ? "star"
                      : (listing.deal_score || 0) >= 6
                      ? "star-half"
                      : "star-outline"
                  }
                  size={24}
                  color={dealColor}
                />
                <Text style={styles.dealScoreTitle}>Deal Score</Text>
              </View>
              <View style={styles.dealScoreContent}>
                <Text style={[styles.dealScoreNumber, { color: dealColor }]}>
                  {listing.deal_score || 0}
                </Text>
                <View style={[styles.dealScoreBadge, { backgroundColor: dealColor }]}>
                  <Text style={styles.dealScoreLabel}>{dealLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Title */}
          {listing.title ? <Text style={styles.title}>{listing.title}</Text> : null}

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            {listing.municipality ? (
              <InfoRow icon="location" label="Location" value={listing.municipality} />
            ) : null}
            {listing.property_type ? (
              <InfoRow icon="home" label="Property Type" value={listing.property_type} />
            ) : null}
            {listing.ad_type ? <InfoRow icon="pricetag" label="Ad Type" value={listing.ad_type} /> : null}
            {listing.rooms != null ? <InfoRow icon="bed" label="Rooms" value={formatRooms(listing.rooms)} /> : null}
            {listing.square_m2 != null ? (
              <InfoRow icon="resize" label="Size" value={formatSquareMeters(listing.square_m2)} />
            ) : null}
            {listing.condition ? <InfoRow icon="hammer" label="Condition" value={listing.condition} /> : null}
            {listing.equipment ? <InfoRow icon="construct" label="Equipment" value={listing.equipment} /> : null}
          </View>

          {/* Additional Details */}
          {(listing.heating || listing.level != null || listing.bathrooms != null || listing.orientation || listing.floor_type || listing.year_built != null) ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Property Details</Text>
              {listing.heating ? <InfoRow icon="flame" label="Heating" value={listing.heating} /> : null}
              {listing.level != null ? <InfoRow icon="layers" label="Floor" value={listing.level.toString()} /> : null}
              {listing.bathrooms != null ? (
                <InfoRow icon="water" label="Bathrooms" value={listing.bathrooms.toString()} />
              ) : null}
              {listing.orientation ? (
                <InfoRow icon="compass" label="Orientation" value={listing.orientation} />
              ) : null}
              {listing.floor_type ? (
                <InfoRow icon="square" label="Floor Type" value={listing.floor_type} />
              ) : null}
              {listing.year_built != null ? (
                <InfoRow icon="calendar" label="Year Built" value={listing.year_built.toString()} />
              ) : null}
            </View>
          ) : null}

          {/* Amenities */}
          {(listing.has_elevator || listing.has_balcony || listing.has_parking || listing.has_garage) ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {listing.has_elevator ? <AmenityBadge icon="business" label="Elevator" /> : null}
                {listing.has_balcony ? <AmenityBadge icon="sunny" label="Balcony" /> : null}
                {listing.has_parking ? <AmenityBadge icon="car" label="Parking" /> : null}
                {listing.has_garage ? <AmenityBadge icon="home" label="Garage" /> : null}
              </View>
            </View>
          ) : null}

          {/* Location */}
          {(listing.latitude != null && listing.longitude != null) ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: listing.latitude,
                    longitude: listing.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                >
                  <Marker
                    coordinate={{
                      latitude: listing.latitude,
                      longitude: listing.longitude
                    }}
                    title={listing.title || 'Property Location'}
                    description={listing.municipality ?? undefined}
                  />
                </MapView>
              </View>
            </View>
          ) : null}

          {/* Description */}
          {listing.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          ) : null}

          {/* Open URL Button */}
          <TouchableOpacity style={styles.openButton} onPress={handleOpenUrl}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.openButtonGradient}
            >
              <Ionicons name="open-outline" size={24} color="#fff" />
              <Text style={styles.openButtonText}>
                {listing.source ? `View on ${listing.source.toUpperCase()}` : 'View on Website'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </Modal>
  )
}

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon} size={20} color="#667eea" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
)

interface AmenityBadgeProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
}

const AmenityBadge: React.FC<AmenityBadgeProps> = ({ icon, label }) => (
  <View style={styles.amenityBadge}>
    <Ionicons name={icon} size={20} color="#667eea" />
    <Text style={styles.amenityLabel}>{label}</Text>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerBadges: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flex: 1
  },
  imageSection: {
    position: 'relative'
  },
  image: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: '#e5e5e5'
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  noImageText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999'
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden'
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  priceSection: {
    backgroundColor: '#fff',
    padding: 20,
    gap: 20
  },
  priceContainer: {
    gap: 8
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    letterSpacing: -1
  },
  priceDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4
  },
  predictedPrice: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500'
  },
  priceSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc'
  },
  pricePerM2: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500'
  },
  dealScoreCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  dealScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  dealScoreTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  dealScoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dealScoreNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: -1
  },
  dealScoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  dealScoreLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 2
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    flex: 1
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8
  },
  amenityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea'
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666'
  },
  mapContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  map: {
    width: '100%',
    height: '100%'
  },
  openButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  openButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12
  },
  openButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  bottomPadding: {
    height: 40
  }
})
