# Frontend App

React Native + Expo app for real estate price prediction in Sarajevo.

## 📱 Features

- 🏠 Real estate price prediction with ML backend
- 📍 Map-based location selection (development build only)
- 📊 Prediction history tracking
- 🏘️ Property listings browser
- 🎨 Modern gradient UI design
- ⚡ Real-time API communication

---

## 🛠️ Tech Stack

- **React Native** - Mobile framework
- **Expo SDK 54** - Development platform
- **TypeScript** - Type safety
- **Expo Router** - File-based navigation
- **expo-linear-gradient** - Modern UI gradients
- **react-native-maps** - Map integration

---

## 📂 Project Structure

```
frontend/
├── app/                     # App screens (Expo Router)
│   ├── (tabs)/             # Tab navigation
│   │   ├── index.tsx       # Prediction form
│   │   ├── history.tsx     # Prediction history
│   │   ├── explore.tsx     # Listings
│   │   └── _layout.tsx     # Tab layout
│   ├── _layout.tsx         # Root layout
│   └── modal.tsx           # Modal screen
├── components/             # Reusable components
│   ├── ui/                # UI primitives
│   ├── MapView.tsx        # Platform-specific map
│   ├── themed-text.tsx
│   └── themed-view.tsx
├── constants/              # App constants
│   └── theme.ts
├── hooks/                  # Custom hooks
│   ├── use-prediction-history.ts
│   ├── use-theme-color.ts
│   └── use-color-scheme.ts
├── assets/                 # Images, fonts
│   └── images/
├── package.json
├── tsconfig.json
└── app.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for testing)
- Expo CLI (installed globally)

### Installation

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npx expo start

# With tunnel (for different networks)
npx expo start --tunnel

# Clear cache if needed
npx expo start --clear
```

### Environment Variables

Create a `.env` file in the frontend directory:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
```

Replace `YOUR_LOCAL_IP` with your computer's local network IP address.

---

## 📱 Running on Devices

### Expo Go (Quick Testing)

1. Install Expo Go from App Store or Play Store
2. Run `npx expo start --tunnel`
3. Scan QR code with Expo Go app
4. **Note**: Maps won't work in Expo Go (requires development build)

### Development Build (Full Features)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Create development build
eas build --profile development --platform android

# Install the build on your device
# Download the APK and install it
```

---

## 🎨 App Structure

### Tabs

1. **Predict** (`index.tsx`) - Main prediction form with map
2. **History** (`history.tsx`) - View past predictions
3. **Explore** (`explore.tsx`) - Browse property listings

### Key Components

- **MapView** - Platform-specific map (native/web versions)
- **LinearGradient** - Modern gradient headers
- **Themed components** - Automatic dark/light mode support

---

## 🔗 API Integration

The app connects to the FastAPI backend running on your local network:

```typescript
// Example API call
const response = await fetch(`${EXPO_PUBLIC_API_URL}/predict`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(predictionData)
});
```

---

## 🏗️ Best Practices (Future Improvements)

For larger apps, consider this structure:

```
frontend/
├── app/                    # Screens (Expo Router)
├── components/            
│   ├── ui/                # Reusable UI components
│   ├── forms/             # Form components
│   └── layouts/           # Layout components
├── features/              # Feature-based modules
│   ├── prediction/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── listings/
│       ├── components/
│       ├── hooks/
│       └── services/
├── services/              # API clients
│   ├── api.ts
│   └── supabase.ts
├── store/                 # State management (Redux/Zustand)
├── utils/                 # Helper functions
├── types/                 # TypeScript types
└── constants/             # App constants
```

---

## 🐛 Common Issues

### Network Request Failed

- Ensure backend is running on `0.0.0.0:8000`
- Check firewall allows port 8000
- Verify phone and computer are on same WiFi network
- Use `--tunnel` mode if on different networks

### Maps Not Working

- Maps require development build (not supported in Expo Go)
- Use the neighborhood dropdown as an alternative
- Or build with `eas build --profile development`

---

## 📦 Building for Production

```bash
# Production Android build
eas build --profile production --platform android

# Production iOS build  
eas build --profile production --platform ios

# Configure app.json before building
# Update version, bundle identifier, etc.
```

---

## 📄 License

ISC`

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/price-predictor-app.git
cd price-predictor-app
````

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Start the Development Server

```bash
npm start
```

Then press:

```bash
w
```

to open the app in **web mode** on your laptop.

---

## 📡 Backend Connection

This app expects a running backend API at:

```
POST /predict
```

Example request body:

```json
{
  "city": "Sarajevo",
  "m2": 55,
  "floor": 2,
  "built": 2015
}
```

Example response:

```json
{
  "price": 137500
}
```

⚠️ Important:

* If testing from a real phone, you **must use your local IP**, not `localhost`.

---

## ✅ Example FastAPI Backend (Minimal)

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Property(BaseModel):
    city: str
    m2: float
    floor: int
    built: int

@app.post("/predict")
def predict_price(data: Property):
    price = data.m2 * 2500
    return { "price": price }
```

Run it using:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📱 Running on a Real Phone (Optional)

1. Install **Expo Go** from Play Store / App Store
2. Run:

```bash
npm start
```

3. Scan the QR code

✅ App opens instantly on your phone.

---

## 🎯 Future Features

* ✅ Prediction history
* ✅ User authentication
* ✅ Charts & price trends
* ✅ Google Maps location picker
* ✅ Cloud deployment
* ✅ Google Play Store release

---

## 👨‍💻 Author

**Mustafa Sinanović**
Software Engineering Student
Specialized in Full-Stack & Machine Learning Applications

GitHub: [https://github.com/musss2003](https://github.com/musss2003)

---

## 📄 License

This project is licensed under the **MIT License**.
