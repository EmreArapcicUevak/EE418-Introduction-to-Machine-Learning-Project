/**
 * Data source configuration
 * To add a new source: Add entry to DATA_SOURCES with config
 */

import { DataSource } from '@/types/listing.types'

export interface SourceConfig {
  id: Exclude<DataSource, 'all'>
  label: string
  color: string
  backgroundColor: string
  icon?: string
  website?: string
}

/**
 * Central configuration for all data sources
 * Add new sources here to automatically support them throughout the app
 */
export const DATA_SOURCES: Record<Exclude<DataSource, 'all'>, SourceConfig> = {
  olx: {
    id: 'olx',
    label: 'OLX',
    color: '#4A90E2',
    backgroundColor: '#4A90E220',
    website: 'https://www.olx.ba'
  },
  nekretnine: {
    id: 'nekretnine',
    label: 'Nekretnine.ba',
    color: '#E2574C',
    backgroundColor: '#E2574C20',
    website: 'https://www.nekretnine.ba'
  }
  // Add new sources here:
  // someNewSource: {
  //   id: 'someNewSource',
  //   label: 'Some New Source',
  //   color: '#00AA00',
  //   backgroundColor: '#00AA0020',
  //   website: 'https://www.example.com'
  // }
}

/**
 * Get all available sources as array
 */
export const getAllSources = (): SourceConfig[] => {
  return Object.values(DATA_SOURCES)
}

/**
 * Get source configuration by ID
 */
export const getSourceConfig = (sourceId: Exclude<DataSource, 'all'>): SourceConfig => {
  return DATA_SOURCES[sourceId]
}

/**
 * Get source options for filters (includes 'all')
 */
export const getSourceFilterOptions = (): { value: Exclude<DataSource, 'all'>; label: string }[] => {
  return [
    ...getAllSources().map(source => ({
      value: source.id as Exclude<DataSource, 'all'>,
      label: source.label
    }))
  ]
}

/**
 * Check if source exists
 */
export const isValidSource = (sourceId: string): sourceId is Exclude<DataSource, 'all'> => {
  return sourceId in DATA_SOURCES
}
