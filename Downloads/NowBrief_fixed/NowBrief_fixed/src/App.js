// src/App.js — NowBrief (React Native 0.73.6)
// Theme: Flashlight app colors — #0A0A0A bg, #FBBF24 amber accent, #141414 cards
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBriefingApi }    from './helpers/useBriefingApi';
import { SummaryTab }        from './components/SummaryTab';
import { WeatherTab }        from './components/WeatherTab';
import { NewsTab }           from './components/NewsTab';
import NowBarService         from './services/LiveNotificationService';
import NowBarStatusBanner    from './components/NowBarStatusBanner';
import LocationPrompt        from './components/LocationPrompt';

// ── Flashlight exact colors ──────────────────────────────────────────────────
const C = {
  bg:      '#0A0A0A',   // Flashlight bg_dark
  surf:    '#141414',   // Flashlight card_bg
  surfup:  '#1E1E1E',   // power_off button
  bdr:     '#222222',   // Flashlight card stroke
  acc:     '#FBBF24',   // amber_400 — exact Flashlight accent
  accDim:  '#2A1800',   // dark amber tint
  txt:     '#FFFFFF',   // text_primary
  sub:     '#AAAAAA',   // mid grey
  dim:     '#888888',   // text_dim
};

const dateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

export default function App() {
  const [tab,          setTab]          = useState(0);
  const [now,          setNow]          = useState(new Date());
  const [needLocation, setNeedLocation] = useState(false);
  const [locationSet,  setLocationSet]  = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const { summary, weather, news, isLoading, isFetching, isError, refetch, locationName } = useBriefingApi();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('nb_location').then(s => {
      if (!s) setNeedLocation(true);
      else setLocationSet(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  }, [isLoading]);

  useEffect(() => {
    if (locationSet) {
      NowBarService.start();
      return () => NowBarService.stop();
    }
  }, [locationSet]);

  const onLocationSet = useCallback(async (loc) => {
    setNeedLocation(false);
    setLocationSet(true);
    refetch();
  }, [refetch]);

  if (needLocation) {
    return (
      <View style={s.root}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content"/>
        <LocationPrompt onLocationSet={onLocationSet}/>
      </View>
    );
  }

  const TABS = [['✦', 'Summary'], ['☁', 'Weather'], ['◼', 'News']];

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content"/>

      {/* Header — Flashlight topBar pattern */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <View style={s.topBar}>
          <View style={s.headerLeft}>
            <Text style={s.appName}>NOWBRIEF</Text>
            <View style={s.locationRow}>
              <Text style={s.locationIcon}>📍</Text>
              <Text style={s.locationTxt}>{locationName || 'Locating...'}</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <View style={s.dateTimeWrap}>
              <Text style={s.timeText}>{timeFormatter.format(now)}</Text>
              <Text style={s.dateText}>{dateFormatter.format(now)}</Text>
            </View>
            <TouchableOpacity
              style={[s.refreshBtn, isFetching && s.refreshBtnDim]}
              onPress={refetch}
              disabled={isFetching}
              activeOpacity={0.7}>
              <Text style={s.refreshIcon}>⟳</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Now Bar status banner */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <NowBarStatusBanner/>
        </View>
      </SafeAreaView>

      {/* Error state */}
      {isError ? (
        <View style={s.errorWrap}>
          <Text style={s.errorEmoji}>⚠️</Text>
          <Text style={s.errorTxt}>Failed to load your daily briefing.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={refetch}>
            <Text style={s.retryTxt}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={[s.contentWrap, { opacity: fadeAnim }]}>
          <View style={s.tabContentArea}>
            {tab === 0 && <SummaryTab data={summary} isLoading={isLoading}/>}
            {tab === 1 && <WeatherTab data={weather}  isLoading={isLoading}/>}
            {tab === 2 && <NewsTab    data={news}     isLoading={isLoading}/>}
          </View>
        </Animated.View>
      )}

      {/* Tab bar — Flashlight card_bg with amber active pill */}
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: C.surf }}>
        <View style={s.tabBar}>
          {TABS.map(([icon, label], i) => (
            <TouchableOpacity key={i} style={s.tabItem} onPress={() => setTab(i)} activeOpacity={0.8}>
              {tab === i
                ? <View style={s.pill}><Text style={s.pillIcon}>{icon}</Text><Text style={s.pillLbl}>{label}</Text></View>
                : <View style={s.tabIconWrap}><Text style={s.tabIcon}>{icon}</Text></View>
              }
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  // Header — matches Flashlight topBar exactly
  topBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16 },
  headerLeft:    { gap: 4 },
  appName:       { fontSize: 13, color: C.txt, letterSpacing: 0.25, fontFamily: 'sans-serif-medium' },
  locationRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationIcon:  { fontSize: 12 },
  locationTxt:   { fontSize: 13, color: C.dim },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateTimeWrap:  { alignItems: 'flex-end' },
  timeText:      { fontSize: 15, fontWeight: '700', color: C.acc, letterSpacing: -0.3 },
  dateText:      { fontSize: 11, color: C.dim },
  refreshBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surfup, borderWidth: 1, borderColor: C.bdr, justifyContent: 'center', alignItems: 'center' },
  refreshBtnDim: { opacity: 0.4 },
  refreshIcon:   { fontSize: 19, color: C.acc },
  // Content
  contentWrap:   { flex: 1 },
  tabContentArea:{ flex: 1, paddingHorizontal: 16, paddingTop: 4 },
  // Error
  errorWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorEmoji:    { fontSize: 40, marginBottom: 12 },
  errorTxt:      { fontSize: 15, color: C.dim, textAlign: 'center', marginBottom: 20 },
  retryBtn:      { backgroundColor: C.acc, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryTxt:      { color: C.bg, fontWeight: '700', fontSize: 15 },
  // Tab bar — Flashlight card_bg style bottom bar
  tabBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderTopWidth: 1, borderTopColor: C.bdr },
  tabItem:       { flex: 1, alignItems: 'center' },
  pill:          { flexDirection: 'row', alignItems: 'center', backgroundColor: C.acc, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 9, gap: 6 },
  pillIcon:      { fontSize: 13, color: C.bg },
  pillLbl:       { fontSize: 13, fontWeight: '700', color: C.bg, letterSpacing: 0.3 },
  tabIconWrap:   { padding: 10 },
  tabIcon:       { fontSize: 17, color: C.dim },
});
