import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/services/supabase'
import { API_URL } from '@/constants/config'

export default function PreferencesScreen() {
  const { user } = useAuth()
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRooms, setMinRooms] = useState('')
  const [minSize, setMinSize] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.replace('/auth/signin')
    }
  }, [user])

  const savePreferences = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${API_URL}/profile/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          min_price: minPrice ? parseInt(minPrice) : null,
          max_price: maxPrice ? parseInt(maxPrice) : null,
          min_rooms: minRooms ? parseInt(minRooms) : null,
          min_size: minSize ? parseInt(minSize) : null,
          municipality: municipality || null
        })
      })

      if (response.ok) {
        Alert.alert('Success', 'Preferences saved successfully')
        router.back()
      } else {
        throw new Error('Failed to save')
      }
    } catch {
      Alert.alert('Error', 'Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Search Preferences</Text>
            <Text style={styles.headerSubtitle}>Customize your property search</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pricetag-outline" size={24} color="#667eea" />
            <Text style={styles.cardTitle}>Price Range (KM)</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>From</Text>
              <TextInput
                style={styles.input}
                value={minPrice}
                onChangeText={setMinPrice}
                placeholder="50,000"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>To</Text>
              <TextInput
                style={styles.input}
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="200,000"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="home-outline" size={24} color="#667eea" />
            <Text style={styles.cardTitle}>Property Details</Text>
          </View>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Minimum Rooms</Text>
            <TextInput
              style={styles.input}
              value={minRooms}
              onChangeText={setMinRooms}
              placeholder="2"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Minimum Size (m²)</Text>
            <TextInput
              style={styles.input}
              value={minSize}
              onChangeText={setMinSize}
              placeholder="50"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Municipality</Text>
            <TextInput
              style={styles.input}
              value={municipality}
              onChangeText={setMunicipality}
              placeholder="e.g., Centar, Novo Sarajevo"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={savePreferences}
          disabled={loading}
          style={styles.saveButton}
        >
          <LinearGradient
            colors={loading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
            style={styles.buttonGradient}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>
              {loading ? 'Saving...' : 'Save Preferences'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    color: '#1a1a1a',
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
})
