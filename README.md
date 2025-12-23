# Real Estate Price Predictor

Full-stack app for Sarajevo real estate: scrapes listings, cleans and stores them in Supabase, serves a FastAPI backend, and ships a React Native (Expo) client with maps, statistics, search, and price prediction.

## Features
- Supabase-authenticated users, profiles, saved listings, preferences, and prediction history.
- Listings from multiple sources (OLX, Nekretnine) with deal-score and price-per-m² logic.
- Statistics and map views (by municipality, ad type), recommendation feed, and filters.
- Data hygiene utilities: drop bad coordinates, normalize municipalities, clean Supabase tables.

## Project Structure
```
backend/
  app/                # FastAPI application
    api/              # Routers (enhanced listings, favorites, statistics)
    core/             # Settings/auth bootstrap
    db/               # Supabase helpers
    models/           # Pydantic schemas
    services/         # Auth/service utilities
    main.py           # FastAPI entrypoint
  scripts/            # Maintenance and scraping utilities
    scrapers/         # OLX / Nekretnine scrapers and helpers
    tests/            # Pytest-based script tests
    data/             # Local CSVs (gitignored if large)
    municipality_mapper.py
    clean_supabase_municipalities.py
    clean_supabase_coordinates.py
    print_municipalities.py
  requirements.txt

frontend/             # React Native (Expo Router) client
  app/                # Screens (tabs, modals, statistics, listings, etc.)
  components/         # UI components (cards, charts, map pieces)
  hooks/              # Data-fetching hooks (useListings, etc.)
  constants/          # API URL, theme
  services/           # API clients
  SCALABLE_ARCHITECTURE.md
  package.json
```

## Backend Setup
Prereqs: Python 3.11+ (tested with 3.14), Supabase project, `pip`.

1) Install deps
```bash
cd backend
pip install -r requirements.txt
```
2) Env (`backend/.env`)
```
SUPABASE_URL=...
SUPABASE_KEY=...                 # anon key
SUPABASE_SERVICE_ROLE_KEY=...    # service key (needed for admin ops)
GOOGLE_MAPS_API_KEY=...          # optional: geocoding in scrapers
```
3) Run API
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Helpful backend scripts
- Clean Supabase municipalities (maps + drops unknowns):  
  `python backend/scripts/clean_supabase_municipalities.py --table listings_olx --table listings_nekretnine --apply`
- Clean Supabase coordinates (remove null/zero lat/long):  
  `python backend/scripts/clean_supabase_coordinates.py`
- Map/clean municipalities locally and write CSV:  
  `python backend/scripts/municipality_mapper.py --csv backend/scripts/data/flats.csv`
- Print municipality counts (Supabase or CSV):  
  `python backend/scripts/print_municipalities.py --table all_listings --categories`
- Scraper tests:  
  `pytest backend/scripts/tests`

## Frontend Setup
Prereqs: Node 18+, npm, Expo CLI.
```bash
cd frontend
npm install
npx expo start --tunnel
```
Configure API URL in `frontend/.env` or `frontend/constants/config.ts` (e.g., `API_URL=http://localhost:8000` when running locally).

## Key API routes (FastAPI)
- Auth: `POST /auth/signup`, `POST /auth/signin`, `GET /auth/me`
- Listings: `GET /listings`, `GET /listings/{id}`, `GET /listings/recommended`
- Favorites: `POST /saved-listings`, `GET /saved-listings`, `DELETE /saved-listings/{id}`
- Predictions: `POST /predict`, `GET /predictions`
- Statistics (v2):
  - `/api/v2/statistics/summary`
  - `/api/v2/statistics/by-municipality` (split by ad_type; unknowns dropped or inferred)
  - `/api/v2/statistics/map-data`
  - `/api/v2/statistics/price-trends`

## Data hygiene rules
- Coordinates: rows with missing/zero lat/long are removed before use.
- Municipalities: normalized via `municipality_mapper`; unmapped values are dropped or set inactive in Supabase cleaners.
- Ad type inference: unknown ad_type entries with price-per-m² above the minimum `Prodaja` threshold are treated as `Prodaja`, others are excluded from stats.

## Testing
- Backend scripts/tests: `pytest backend/scripts/tests`
- (Add more FastAPI/unit tests as needed.)

## Notes
- Supabase service key is required for admin ops (sync/clean). Use anon key for client-only reads.
- When running Expo against a local backend, ensure devices can reach your host IP/port or use the tunnel option.
- Publication date

**Amenities (Boolean flags):**
- Elevator/Lift
- Garage
- Parking space
- Balcony
- Internet connection
- Cable TV
- Basement/Attic storage

**Flexible Storage:**
- Unmapped fields stored in JSONB for future use
- Automatic field discovery and extraction

### Database Migration

To add the enhanced fields to your database:

```bash
cd backend/migrations

# Install psycopg2 if needed
pip install psycopg2-binary

# Run migration
python run_enhanced_fields_migration.py
```

**What's Added:**
- 15+ new database columns
- 6 performance indexes (including spatial and JSONB)
- 2 utility views (listings_with_location, listings_with_amenities)
- 1 distance calculation function (Haversine formula)

### Field Mapping

The sync service automatically maps Bosnian field names to English database columns:

| Bosnian Field | Database Column | Type |
|--------------|-----------------|------|
| adresa | address | TEXT |
| broj_kupatila | bathrooms | INTEGER |
| primarna_orjentacija | orientation | TEXT |
| vrsta_poda | floor_type | TEXT |
| godina_izgradnje | year_built | TEXT |
| garaža | has_garage | BOOLEAN |
| lift | has_elevator | BOOLEAN |
| balkon | has_balcony | BOOLEAN |

**Documentation:**
- 📖 [ENHANCED_FIELDS_GUIDE.md](./backend/ENHANCED_FIELDS_GUIDE.md) - Complete implementation guide
- 🚀 [DEPLOYMENT_CHECKLIST.md](./backend/DEPLOYMENT_CHECKLIST.md) - Step-by-step deployment
- 📊 [IMPLEMENTATION_SUMMARY.md](./backend/IMPLEMENTATION_SUMMARY.md) - Feature overview

See [backend/database_auth_setup.sql](./backend/database_auth_setup.sql) for complete schema.

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Supabase** - PostgreSQL database and auth
- **Pandas** - Data processing
- **Uvicorn** - ASGI server

### Frontend
- **React Native** - Mobile framework
- **Expo SDK 54** - Development platform
- **TypeScript** - Type safety
- **expo-linear-gradient** - Modern UI gradients
- **react-native-maps** - Map integration

## 📱 Features

- 🏠 Real estate price prediction based on property features
- 🔐 User authentication with secure JWT tokens
- 👤 Personalized user profiles with preferences
- 📍 Map-based location selection (requires development build)
- ⭐ Save favorite listings for later
- 🎯 Get personalized recommendations based on preferences
- 📊 Track prediction history across devices
- 🏘️ Browse property listings with deal scores
- 💾 Persistent data storage with Supabase
- 🎨 Modern gradient UI design with dark mode

## 🔒 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

## 🚀 Quick Start with Authentication

See [AUTH_SETUP_CHECKLIST.md](./AUTH_SETUP_CHECKLIST.md) for step-by-step setup guide.

**Quick setup:**
1. Run SQL migration in Supabase ([database_auth_setup.sql](./backend/database_auth_setup.sql))
2. Add Supabase credentials to `.env` files
3. Install frontend dependencies: `@supabase/supabase-js` and `@react-native-async-storage/async-storage`
4. Implement auth screens (see [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md))
5. Test authentication flow

## 📚 Documentation

- **[AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)** - Complete authentication implementation guide
- **[AUTH_SETUP_CHECKLIST.md](./AUTH_SETUP_CHECKLIST.md)** - Step-by-step setup checklist
- **[backend/README.md](./backend/README.md)** - Backend API documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend app documentation

## 🧪 Development Notes

- Backend runs on `http://0.0.0.0:8000` (accessible from network)
- Frontend uses tunnel mode for testing on physical devices
- Maps feature requires Expo development build (not available in Expo Go)

## 📝 License

ISC

## 👥 Contributors

Mustafa Sinanovic
