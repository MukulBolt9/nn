// src/components/SummaryTab.js
// Theme: Flashlight amber #FBBF24, bg #0A0A0A, card #141414
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { GeminiService } from '../services/GeminiService';

const C = {
  bg:     '#0A0A0A', surf:  '#141414', surfhi: '#1E1E1E',
  bdr:    '#222222', acc:   '#FBBF24', accDim: '#2A1800',
  txt:    '#FFFFFF', sub:   '#AAAAAA', dim:    '#888888',
  blue:   '#60A5FA', ok:    '#22C55E', warn:   '#F97316',
};

const GREETINGS = {
  morning:   ['Good morning! ☀️', 'Rise and shine! 🌅', "Let's make today count 🚀"],
  afternoon: ['Good afternoon! 🌤', 'Keeping up great? 💼', 'Afternoon check-in 👋'],
  evening:   ['Good evening! 🌇', 'Winding down? 🌙', 'Great work today 🎉'],
  night:     ['Night owl! 🦉', 'Rest well soon 😴', 'Sweet dreams 🌙'],
};

function getGreeting() {
  const h = new Date().getHours();
  const k = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
  const p = GREETINGS[k];
  return p[Math.floor(Date.now() / 3600000) % p.length];
}

function getDayProg() {
  const n = new Date();
  return Math.round(((n.getHours() * 60 + n.getMinutes()) / 1440) * 100);
}

function GCard({ title, emoji, children }) {
  return (
    <View style={s.card}>
      <View style={s.cardHdr}>
        <Text style={s.cardEmoji}>{emoji}</Text>
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      <View style={s.cardBody}>{children}</View>
    </View>
  );
}

export function SummaryTab({ data, isLoading }) {
  const prog     = getDayProg();
  const greeting = getGreeting();
  const [wellTip, setWellTip] = useState('');

  useEffect(() => {
    if (data?.weather) {
      GeminiService.getWellnessTip(data.weather, new Date().getHours()).then(setWellTip).catch(() => {});
    }
  }, [data?.weather?.temp]);

  if (isLoading && !data) return (
    <View style={s.center}>
      <ActivityIndicator color={C.acc} size="large"/>
      <Text style={s.loadTxt}>Preparing your brief...</Text>
    </View>
  );

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Hero card — Flashlight bg_on amber glow */}
      <View style={s.hero}>
        <View style={s.heroGlow}/>
        <Text style={s.heroGreet}>{greeting}</Text>
        <Text style={s.heroHead}>
          {data?.headline || (data?.weather ? `${data.weather.emoji} ${data.weather.temp}°C · ${data.weather.description}` : 'Your brief is ready')}
        </Text>
        {data?.weatherTip ? <Text style={s.heroSub}>{data.weatherTip}</Text> : null}
        {/* Day progress — Flashlight seekbar style */}
        <View style={s.progRow}>
          <View style={s.progBg}>
            <View style={[s.progFill, { width: `${prog}%` }]}/>
          </View>
          <Text style={s.progTxt}>{prog}% of day</Text>
        </View>
      </View>

      {/* Rain warning */}
      {data?.rainWarning && (
        <View style={s.warnBanner}>
          <Text style={s.warnEmoji}>☂</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.warnTitle}>Rain expected soon</Text>
            <Text style={s.warnSub}>Bring an umbrella today</Text>
          </View>
        </View>
      )}

      {/* AI brief */}
      {data?.newsBite && (
        <GCard title="AI Daily Brief" emoji="🤖">
          <Text style={s.aiTxt}>{data.newsBite}</Text>
          {data?.affirmation && <Text style={[s.aiTxt, { color: C.acc, marginTop: 8 }]}>{data.affirmation}</Text>}
        </GCard>
      )}

      {/* Weather strip */}
      {data?.weather && (
        <GCard title={`Right Now · ${data.weather.city}`} emoji={data.weather.emoji}>
          <View style={s.strip}>
            {[
              ['Temp',     `${data.weather.temp}°C`],
              ['Feels',    `${data.weather.feelsLike}°C`],
              ['Humidity', `${data.weather.humidity}%`],
              ['Wind',     `${data.weather.windSpeed} km/h`],
            ].map(([l, v]) => (
              <View key={l} style={s.stripItem}>
                <Text style={s.stripVal}>{v}</Text>
                <Text style={s.stripLbl}>{l}</Text>
              </View>
            ))}
          </View>
        </GCard>
      )}

      {/* Wellness tip */}
      {!!wellTip && (
        <GCard title="Wellness" emoji="🧘">
          <Text style={s.aiTxt}>{wellTip}</Text>
        </GCard>
      )}

      {/* Music */}
      {data?.music?.length > 0 && (
        <GCard title="Music for the Mood" emoji="🎵">
          {data.music.map((t, i) => (
            <TouchableOpacity
              key={i}
              style={s.musicRow}
              activeOpacity={0.7}
              onPress={() => Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(t.youtubeQuery)}`)}>
              <View style={[s.musicThumb, { backgroundColor: [C.accDim, '#1A1400', '#1A1200'][i % 3] }]}>
                <Text style={{ fontSize: 18 }}>♪</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.musicTitle} numberOfLines={1}>{t.title}</Text>
                <Text style={s.musicArtist}>{t.artist} · {t.mood}</Text>
              </View>
              <Text style={{ fontSize: 22, color: C.dim }}>›</Text>
            </TouchableOpacity>
          ))}
        </GCard>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loadTxt: { color: C.sub, marginTop: 12, fontSize: 14 },
  // Hero — amber glow matching Flashlight bg_on radial
  hero:     { backgroundColor: C.surf, borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: C.bdr, overflow: 'hidden' },
  heroGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: C.accDim, opacity: 0.8 },
  heroGreet:{ fontSize: 13, color: C.sub, marginBottom: 5 },
  heroHead: { fontSize: 19, fontWeight: '700', color: C.txt, lineHeight: 26, marginBottom: 4 },
  heroSub:  { fontSize: 13, color: C.sub, marginBottom: 14 },
  // Progress bar — exact Flashlight seekbar (amber fill, dark bg)
  progRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progBg:   { flex: 1, height: 4, backgroundColor: '#333333', borderRadius: 2, overflow: 'hidden' },
  progFill: { height: 4, backgroundColor: C.acc, borderRadius: 2 },
  progTxt:  { fontSize: 11, color: C.dim, width: 70 },
  // Rain warning
  warnBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0E1E2D', borderRadius: 14, padding: 13, marginBottom: 12, borderWidth: 1, borderColor: '#1E3A5F', gap: 12 },
  warnEmoji:  { fontSize: 26 },
  warnTitle:  { fontSize: 14, fontWeight: '700', color: '#60C8FF' },
  warnSub:    { fontSize: 12, color: C.sub, marginTop: 2 },
  // Cards — Flashlight card_bg exact copy
  card:      { backgroundColor: C.surf, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: C.bdr, overflow: 'hidden' },
  cardHdr:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingTop: 13, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.bdr },
  cardEmoji: { fontSize: 15 },
  cardTitle: { fontSize: 11, fontWeight: '700', color: C.dim, textTransform: 'uppercase', letterSpacing: 1.2 },
  cardBody:  { padding: 15 },
  aiTxt:     { fontSize: 14, color: C.txt, lineHeight: 21 },
  // Weather strip
  strip:     { flexDirection: 'row', justifyContent: 'space-between' },
  stripItem: { alignItems: 'center', flex: 1 },
  stripVal:  { fontSize: 14, fontWeight: '700', color: C.acc },
  stripLbl:  { fontSize: 10, color: C.dim, marginTop: 3 },
  // Music
  musicRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 11, borderBottomWidth: 1, borderBottomColor: C.bdr },
  musicThumb: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.bdr },
  musicTitle: { fontSize: 14, fontWeight: '600', color: C.txt },
  musicArtist:{ fontSize: 11, color: C.sub, marginTop: 2 },
});
