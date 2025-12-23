# Data Directory

This directory contains the scraped and processed apartment listing data for Canton Sarajevo.

## Files

- `sarajevo_flats.csv` - Raw scraped data from OLX.ba
- `sarajevo_flats_merged_olx_cleaned.csv` - Cleaned and processed dataset

## Data Quality Notes

### Geographic Boundaries and Canton Sarajevo

#### Issue Resolution: Apartments Outside Strict Geographic Boundaries

During the analysis phase, approximately 13 apartments were identified as falling slightly outside the strict geographic boundaries of Canton Sarajevo when plotted on a map. After careful consideration, **these apartments have been retained in the dataset**.

#### Reasoning:

1. **Administrative Classification**: All apartments were scraped using the `canton=9` filter parameter on OLX.ba, indicating they are administratively classified as Canton Sarajevo listings.

2. **Valid Municipality Data**: Each of the 13 apartments has a valid municipality field corresponding to known Canton Sarajevo municipalities:
   - Sarajevo - Novi Grad
   - Sarajevo - Centar
   - Sarajevo - Novo Sarajevo
   - Sarajevo - Stari Grad
   - Ilidža
   - Trnovo
   - Vogošća
   - Ilijaš
   - Hadžići

3. **Boundary Precision Issues**: Geographic boundaries from GIS shapefiles may not perfectly align with:
   - Administrative/municipal boundaries
   - Real estate market definitions
   - Practical neighborhood boundaries
   - Geocoding accuracy limitations

4. **Data Integrity**: Removing entries based solely on slight geographic misalignment would:
   - Reduce dataset size unnecessarily
   - Potentially introduce geographic bias
   - Remove valid market data
   - Conflict with the source's own classification

5. **Machine Learning Considerations**: For predictive modeling:
   - Municipality is a stronger categorical feature than precise lat/long coordinates
   - Geocoding errors are common and may explain boundary discrepancies
   - The scraped data represents actual market listings, which is valuable regardless of minor coordinate issues

#### Examples of Affected Listings:

Based on the analysis, the following are examples of valid apartments that fall slightly outside strict boundaries but are retained:

| Index | Municipality           | Condition      | Ad Type | Rooms | Square M² | Price | Heating Type          |
|-------|------------------------|----------------|---------|-------|-----------|-------|----------------------|
| 14    | Sarajevo - Novi Grad   | New Build      | Rent    | 1.0   | 35.0      | 400   | Central Gas Heating   |
| 40    | Sarajevo - Centar      | Good Condition | Rent    | 1.0   | 38.0      | 550   | District Heating      |
| 47    | Sarajevo - Novo Sarajevo | Renovated    | Rent    | 2.0   | 44.0      | 550   | District Heating      |
| 107   | Ilidža                 | New Build      | Rent    | 3.0   | 57.0      | 750   | District Heating      |
| 326   | Trnovo                 | New Build      | Sale    | 2.0   | 30.0      | 149500| Electric Heating      |

All of these listings have complete feature sets and represent legitimate Canton Sarajevo real estate.

#### Recommendation for Future Analysis:

When performing geographic analysis or visualization:
- **Do not** automatically exclude apartments based solely on strict polygon boundary checks
- **Do** use municipality as the primary geographic grouping variable
- **Do** consider flagging or color-coding boundary-outliers in visualizations if needed
- **Do** trust the source's administrative classification (canton=9 parameter)

#### Data Cleaning Policy:

The data cleaning process should:
1. ✅ Keep all apartments with valid Canton Sarajevo municipality values
2. ✅ Keep all apartments scraped with the `canton=9` filter
3. ✅ Remove only clear duplicates, invalid entries, or corrupted data
4. ❌ NOT remove apartments based solely on geographic coordinate boundaries

---

## Data Source

Data is scraped from OLX.ba using the following search parameters:
- Category: Apartments (category_id=23)
- Canton: Sarajevo Canton (canton=9)
- URL pattern: `https://olx.ba/pretraga?attr=&attr_encoded=1&q=stanovi&category_id=23&page={page}&canton=9`

**Note**: CSV files in this directory are excluded from version control via `.gitignore` to prevent large data files in the repository.
