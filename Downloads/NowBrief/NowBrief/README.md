# NowBrief 🌟

A Samsung Galaxy-inspired smart briefing app with **real Live Notifications**, **Now Bar support**, and **AI-powered daily insights** using Gemini.

---

## ✨ Features

### 📱 App (3 Tabs)
| Tab | Content |
|-----|---------|
| **Brief** | AI summary, music recs with thumbnails, 7-day forecast mini, motivational quotes |
| **Weather** | Full weather dashboard, 7-day forecast, AI insights (what to wear, activity, health, travel) |
| **News** | 8 categories (Tech, World, Science, Business, Health, Sports, Entertainment, India) — AI-generated summaries |

### 🔔 Live Notifications (Samsung One UI 7+)
- **Real foreground service** running continuously
- **Cycling messages** every 45 seconds (Good morning, wishing you well, etc.)
- **Samsung Live Notification** metadata with primary/secondary text + chip
- **Now Bar chip** appears at top-left of screen
- **Action buttons**: Next (cycle message) + Dismiss
- **Auto-starts on boot**

### 🤖 AI Integration (Gemini 1.5 Flash)
- Daily greeting and briefing
- Weather-based outfit/activity/health tips
- Mood-matched music recommendations
- Categorized news generation
- All fetched in real-time

### 🌤️ Weather (Open-Meteo — Free, No API Key)
- Current conditions with WMO weather codes
- Feels-like temperature
- Humidity, wind speed, precipitation probability
- 7-day forecast
- Sunrise/sunset times
- Auto-detects location (falls back to Howrah, WB)

---

## 🚀 Setup

### Prerequisites
```
Node.js 18+
React Native CLI
Android Studio
JDK 17
```

### Install
```bash
git clone https://github.com/YOUR_USERNAME/NowBrief
cd NowBrief
npm install
cd android && ./gradlew clean && cd ..
```

### Run
```bash
npx react-native run-android
```

---

## 🔧 Samsung Live Notification Setup

### AndroidManifest.xml (already configured)
```xml
<!-- Required metadata for Samsung One UI -->
<meta-data
    android:name="com.samsung.android.support.ongoing_activity"
    android:value="true" />
```

### Foreground Service (NowBriefLiveService.kt)
The service sends Samsung Live Notification extras:
```kotlin
val extras = bundleOf(
    "android.ongoingActivityNoti.style" to 1,
    "android.ongoingActivityNoti.primaryInfo" to "☀️ Good morning!",
    "android.ongoingActivityNoti.secondaryInfo" to "23°C · Partly cloudy",
    "android.ongoingActivityNoti.chipBgColor" to chipColor,
    "android.ongoingActivityNoti.chipExpandedText" to "Good morning!",
    "android.ongoingActivityNoti.actionType" to 1,
    "android.ongoingActivityNoti.actionPrimarySet" to 0,
)
```

### ⚠️ Samsung Whitelist Requirement
Samsung Live Notifications and Now Bar require your app to be on Samsung's whitelist (determined by package name: `com.nowbrief`).

**For development/testing:**
- The foreground notification still shows as a persistent notification on non-Samsung or non-whitelisted devices
- On Samsung devices with One UI 7+, if whitelisted, it appears as a Live Notification in the notification drawer and as a chip (Now Bar) at the top of the screen

**To get whitelisted:** Contact Samsung Developer Relations or apply through Samsung's partner program.

---

## 📁 Project Structure

```
NowBrief/
├── App.tsx                          # Root with navigation
├── src/
│   ├── screens/
│   │   ├── SummaryScreen.tsx        # Tab 1: AI Brief + Music
│   │   ├── WeatherScreen.tsx        # Tab 2: Weather + AI Insights
│   │   └── NewsScreen.tsx           # Tab 3: Categorized News
│   ├── components/
│   │   └── TabBar.tsx               # Custom animated tab bar
│   └── services/
│       ├── geminiService.ts         # Gemini 1.5 Flash API calls
│       └── weatherService.ts        # Open-Meteo weather API
├── android/
│   └── app/src/main/
│       ├── AndroidManifest.xml      # Permissions + Samsung metadata
│       └── java/com/nowbrief/
│           ├── services/
│           │   └── NowBriefLiveService.kt  # Foreground service
│           ├── activities/
│           │   └── NowBriefActivity.kt     # Dedicated Now Bar activity
│           ├── receivers/
│           │   ├── BootReceiver.kt
│           │   └── NotificationActionReceiver.kt
│           └── utils/
│               ├── GeminiHelper.kt         # Native Gemini calls
│               └── WeatherHelper.kt        # Native weather fetching
```

---

## 🔑 API Keys

| Service | Key | Notes |
|---------|-----|-------|
| Gemini | `AIzaSyC356BnpkkFlWyIclsX5aB1OMvY-uNW0Hk` | Already configured |
| Weather | None needed | Open-Meteo is free |
| News | Via Gemini | AI-generated |

---

## 📦 GitHub

```bash
git init
git add .
git commit -m "feat: NowBrief - Samsung Live Notification app with Gemini AI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/NowBrief.git
git push -u origin main
```

---

## 🎨 Design System

- **Background**: `#0a0a0f` (near-black)
- **Cards**: `#12121a`
- **Accent**: `#60efff` (cyan glow)
- **Secondary**: `#f093fb` (purple)
- **Success**: `#4ade80`
- **Warning**: `#fbbf24`

---

## 📝 Notes

- News is AI-generated via Gemini (not real news feeds) — connect a news API like NewsAPI.org for real headlines
- Music recommendations are AI-suggested — connect Spotify API for real playback
- Weather data is real (Open-Meteo)
- Samsung Live Notification requires Samsung device with One UI 7+ and whitelist approval
- The foreground service runs on ALL Android devices as a persistent notification

---

Built with ❤️ using React Native + Kotlin + Gemini AI
