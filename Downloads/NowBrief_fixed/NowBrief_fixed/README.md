# NowBrief — Fixed Edition

## What was fixed (everything)

### 🎨 Theme — Flashlight app colors applied exactly
All colors are now copied exactly from the Flashlight app:

| Token | Hex | Original name |
|---|---|---|
| Background | `#0A0A0A` | `bg_dark` |
| Card/Surface | `#141414` | `card_bg` |
| Surface Elevated | `#1E1E1E` | `power_off button` |
| Border/Stroke | `#222222` | card stroke |
| **Accent** | **`#FBBF24`** | **`amber_400`** — exact Flashlight accent |
| Accent mid | `#F59E0B` | `amber_500` |
| Text primary | `#FFFFFF` | `text_primary` |
| Text dim | `#888888` | `text_dim` |
| Seekbar bg | `#333333` | `seekbar_bg` |

### 📐 Layout — Flashlight patterns used everywhere
- **Header**: exact `topBar` pattern from Flashlight `activity_main.xml` — horizontal layout, app name left, status right
- **Tab bar**: amber pill (active), dim icon (inactive) — same as Flashlight ON/OFF pattern  
- **Cards**: exact `card_bg.xml` — `#141414`, 18dp radius, 1dp `#222222` border
- **Progress bar**: exact Flashlight SeekBar style — `#333333` track, `#FBBF24` fill, 4dp height
- **Amber glow**: hero cards use radial amber glow matching Flashlight `bg_on.xml` gradient

### 🔔 NowBar / Samsung Now Bar — unchanged and working
- All Samsung bundle keys intact: `android.ongoingActivityNoti.*`
- Whitelist bypass metadata in `AndroidManifest.xml`: `com.samsung.android.support.ongoing_activity`
- `NowBriefNotificationHelper.java` — unchanged, fully functional
- `NowBriefModule.java` — unchanged
- `LiveNotificationService.js` — unchanged
- `NativeNotificationBridge.js` — unchanged

### 🌤 Weather — unchanged and working
- `WeatherService.js` — Open-Meteo API, unchanged
- `WeatherTab.js` — redesigned with Flashlight theme, all data intact

### 📰 News — unchanged and working
- `NewsService.js` — GNews API with mock fallback, unchanged
- `NewsTab.js` — redesigned with Flashlight amber chip/card style

### 🤖 AI (Gemini) — unchanged
- `GeminiService.js` — unchanged, all functions intact

---

## Setup

```bash
npm install
cd android && ./gradlew assembleDebug
```

Or run directly:
```bash
npx react-native run-android
```

## API Keys needed
- `GeminiService.js` line 6: replace `KEY` with your Gemini API key
- `NewsService.js` line 4: replace `GNEWS_KEY` with your GNews key (free at gnews.io)

## Samsung Now Bar
Enable in: **Developer Options → Live notifications for all apps → ON**
