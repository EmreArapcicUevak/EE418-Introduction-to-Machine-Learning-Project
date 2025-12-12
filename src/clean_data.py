"""
Data cleaning pipeline for Sarajevo real-estate dataset.

This module implements a principled data-cleaning pipeline based on exploratory
feature analysis, focusing on categorical structure, numeric distributions, and
missing-data behavior prior to modeling.

Key transformations:
- Translate categorical variables to English and convert to category dtype
- Remove redundant columns (property_type with synonymous values)
- Fix categorical outliers (incorrect condition values)
- Merge rare categories (e.g., wood heating into "Other")
- Remove municipalities with negligible representation
- Cap floor values labeled as "20+" to realistic maximum
- Remove rows with missing target variable (price)
- Drop latitude/longitude due to high missingness and data quality concerns
"""

import pandas as pd
import numpy as np
from typing import Optional
import argparse
import sys


class SarajevoFlatsDataCleaner:
    """
    Data cleaner for Sarajevo real estate dataset.
    
    Implements systematic cleaning steps based on feature analysis findings.
    """
    
    def __init__(self):
        """Initialize the data cleaner."""
        # Municipalities to remove (negligible representation)
        self.municipalities_to_remove = ['Ilijaš', 'Hadžići']
        
        # Categorical columns that should be converted to category dtype
        self.categorical_columns = [
            'municipality', 'condition', 'ad_type', 'equipment', 'heating'
        ]
    
    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply all cleaning transformations to the dataset.
        
        Args:
            df: Raw apartment dataset
            
        Returns:
            Cleaned dataset ready for modeling
        """
        df = df.copy()
        
        # Apply each cleaning step in sequence
        df = self._convert_categorical_dtypes(df)
        df = self._remove_property_type(df)
        df = self._fix_condition_outliers(df)
        df = self._merge_rare_heating_categories(df)
        df = self._remove_rare_municipalities(df)
        df = self._cap_floor_values(df)
        df = self._remove_missing_prices(df)
        df = self._remove_missing_rooms(df)
        df = self._drop_coordinates(df)
        
        return df
    
    def _convert_categorical_dtypes(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Convert categorical columns to category dtype for memory efficiency.
        
        All categorical variables should already be translated to English.
        This step casts them to the category dtype for consistency and efficiency.
        
        Args:
            df: Input dataframe
            
        Returns:
            Dataframe with categorical columns properly typed
        """
        for col in self.categorical_columns:
            if col in df.columns:
                df[col] = df[col].astype('category')
        
        return df
    
    def _remove_property_type(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Remove property_type column as it contains only synonymous values.
        
        The property_type column only contains "Apartment" and "Flat", which
        are synonymous and provide no meaningful distinction for modeling.
        
        Args:
            df: Input dataframe
            
        Returns:
            Dataframe without property_type column
        """
        if 'property_type' in df.columns:
            df = df.drop(columns=['property_type'])
        
        return df
    
    def _fix_condition_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Remove outlier in condition column.
        
        A clear outlier exists where condition is incorrectly labeled as
        "Apartment" (or "Apartman" in the original language). These rows
        should be removed as they represent data entry errors.
        
        Args:
            df: Input dataframe
            
        Returns:
            Dataframe with condition outliers removed
        """
        if 'condition' in df.columns:
            # Remove rows where condition is "Apartman" or "Apartment"
            df = df[~df['condition'].isin(['Apartman', 'Apartment'])]
        
        return df
    
    def _merge_rare_heating_categories(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Merge rare heating categories into "Other".
        
        Wood heating appears only in a very small number of listings and is
        merged into an "Other" category to reduce sparsity while preserving
        valid observations.
        
        Args:
            df: Input dataframe
            
        Returns:
            Dataframe with rare heating categories merged
        """
        if 'heating' in df.columns:
            # Temporarily convert to string to avoid FutureWarning with categorical replace
            is_categorical = pd.api.types.is_categorical_dtype(df['heating'])
            if is_categorical:
                df['heating'] = df['heating'].astype(str)
            
            # Merge wood heating into "Other"
            # Wood heating in the original language could be "Drvo" or "Wood"
            df['heating'] = df['heating'].replace(['Drvo', 'Wood'], 'Ostalo')
            
            # If "Ostalo" doesn't exist in the data, map to "Other"
            if 'Ostalo' in df['heating'].values and 'Ostalo' not in df['heating'].unique():
                df['heating'] = df['heating'].replace('Ostalo', 'Other')
            
            # Convert back to category
            if is_categorical:
                df['heating'] = df['heating'].astype('category')
        
        return df
    
    def _remove_rare_municipalities(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Remove municipalities with negligible representation.
        
        Municipalities with negligible representation across both rentals and
        sales (Ilijaš and Hadžići) are removed due to insufficient data support.
        Other municipalities with imbalanced but meaningful representation
        (e.g., Trnovo) are retained.
        
        Args:
            df: Input dataframe
            
        Returns:
            Dataframe with rare municipalities removed
        """
        if 'municipality' in df.columns:
            df = df[~df['municipality'].isin(self.municipalities_to_remove)]
        
        return df
    
    def _cap_floor_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Cap floor values labeled as "20+" to 20.
        
        Floor values labeled as "20+" are capped at 20, reflecting realistic
        building heights in Sarajevo.
        
        Args:
            df: Input dataframe
            
        Returns:
            Dataframe with floor values capped
        """
        if 'level' in df.columns:
            # Replace "20+" with 20 and convert to numeric
            df['level'] = df['level'].replace('20+', '20')
            # Convert to numeric, handling any non-numeric values
            df['level'] = pd.to_numeric(df['level'], errors='coerce')
        
        return df
    
    def _remove_missing_prices(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Remove rows with missing prices.
        
        Missing prices were analyzed separately for rentals and sales. The
        distributions of other numeric features differed between missing and
        non-missing prices, indicating that price missingness is likely not
        completely at random. Because price is the target variable, listings
        with missing prices are removed rather than imputed.
        
        Args:
            df: Input dataframe
            
        Returns:
            Dataframe without missing prices
        """
        if 'price' in df.columns:
            df = df.dropna(subset=['price'])
        
        return df
    
    def _remove_missing_rooms(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Remove rows with missing room counts.
        
        Missing values in rooms were relatively few. Rows with missing rooms
        are removed to maintain a clean supervised learning setup.
        
        Args:
            df: Input dataframe
            
        Returns:
            Dataframe without missing room counts
        """
        if 'rooms' in df.columns:
            df = df.dropna(subset=['rooms'])
        
        return df
    
    def _drop_coordinates(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Drop latitude and longitude columns.
        
        Latitude and longitude are dropped entirely due to a high number of
        missing values and concerns that many coordinates refer to seller
        location rather than property location.
        
        Args:
            df: Input dataframe
            
        Returns:
            Dataframe without coordinate columns
        """
        coords_to_drop = ['latitude', 'longitude', 'lat', 'lon', 'lng']
        existing_coords = [col for col in coords_to_drop if col in df.columns]
        
        if existing_coords:
            df = df.drop(columns=existing_coords)
        
        return df


def main():
    """
    Main entry point for the data cleaning script.
    
    Usage:
        python clean_data.py input.csv output.csv
    """
    parser = argparse.ArgumentParser(
        description='Clean Sarajevo real estate dataset'
    )
    parser.add_argument(
        'input_file',
        help='Path to input CSV file'
    )
    parser.add_argument(
        'output_file',
        help='Path to output CSV file'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Print detailed information about cleaning steps'
    )
    
    args = parser.parse_args()
    
    try:
        # Load data
        if args.verbose:
            print(f"Loading data from {args.input_file}...")
        df = pd.read_csv(args.input_file)
        
        if args.verbose:
            print(f"Loaded {len(df)} rows")
            print(f"Columns: {list(df.columns)}")
        
        # Clean data
        cleaner = SarajevoFlatsDataCleaner()
        
        if args.verbose:
            print("\nApplying cleaning transformations...")
        
        df_cleaned = cleaner.clean(df)
        
        if args.verbose:
            print(f"\nCleaning complete!")
            print(f"Rows after cleaning: {len(df_cleaned)}")
            print(f"Rows removed: {len(df) - len(df_cleaned)}")
            print(f"Columns after cleaning: {list(df_cleaned.columns)}")
        
        # Save cleaned data
        df_cleaned.to_csv(args.output_file, index=False)
        
        if args.verbose:
            print(f"\nCleaned data saved to {args.output_file}")
        
        return 0
        
    except FileNotFoundError:
        print(f"Error: Input file '{args.input_file}' not found", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Error during cleaning: {e}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
