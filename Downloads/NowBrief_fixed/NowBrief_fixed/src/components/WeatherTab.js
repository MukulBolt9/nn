// src/components/WeatherTab.js
// Theme: Flashlight amber_400 #FBBF24, bg #0A0A0A, card #141414
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { GeminiService } from '../services/GeminiService';

const W = Dimensions.get('window').width;
const C = {
  bg:   '#0A0A0A', surf: '#141414', surfhi: '#1E1E1E',
  bdr:  '#222222', acc:  '#FBBF24', accDim: '#2A1800',
  txt:  '#FFFFFF', sub:  '#AAAAAA', dim: '#888888',
  blue: '#60A5FA',
};

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

export function WeatherTab({ data, isLoading }) {
  const [aiSum,  setAiSum]  = useState('');
  const [aiLoad, setAiLoad] = useState(false);

  useEffect(() => {
    if (!data) return;
    setAiLoad(true);
    GeminiService.getWeatherSummary(data).then(setAiSum).catch(() => {}).finally(() => setAiLoad(false));
  }, [data?.temp]);

  if (isLoading && !data) return <View style={s.center}><ActivityIndicator color={C.acc} size="large"/></View>;
  if (!data) return <View style={s.center}><Text style={s.dimTxt}>Weather unavailable. Pull to refresh.</Text></View>;

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Big weather hero — Flashlight bg_on gradient vibe */}
      <View style={s.bigWx}>
        <View style={s.bigGlow}/>
        <View style={s.bigTop}>
          <Text style={s.bigEmoji}>{data.emoji}</Text>
          <View>
            <Text style={s.bigTemp}>{data.temp}°C</Text>
            <Text style={s.bigDesc}>{data.description}</Text>
            <Text style={s.bigCity}>{data.city}, {data.country}</Text>
          </View>
        </View>
        <Text style={s.bigFeels}>Feels {data.feelsLike}°C · {data.humidity}% humidity</Text>
      </View>

      <GCard title="AI Weather Brief" emoji="🤖">
        {aiLoad
          ? <ActivityIndicator color={C.acc}/>
          : <Text style={s.aiTxt}>{aiSum || 'Generating AI summary...'}</Text>
        }
      </GCard>

      <GCard title="Conditions" emoji="📊">
        <View style={s.statsGrid}>
          {[
            ['💨', 'Wind',     `${data.windSpeed} km/h`],
            ['💧', 'Humidity', `${data.humidity}%`],
            ['🌡', 'Pressure', `${data.pressure} hPa`],
            ['🌧', 'Precip',   `${data.precipitation} mm`],
          ].map(([ic, lb, vl]) => (
            <View key={lb} style={s.statCell}>
              <Text style={s.statIcon}>{ic}</Text>
              <Text style={s.statVal}>{vl}</Text>
              <Text style={s.statLbl}>{lb}</Text>
            </View>
          ))}
        </View>
      </GCard>

      {data.hourly?.length > 0 && (
        <GCard title="Hourly" emoji="⏰">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {data.hourly.map((h, i) => (
              <View key={i} style={s.hItem}>
                <Text style={s.hTime}>{String(h.hour).padStart(2, '0')}:00</Text>
                <Text style={s.hEmoji}>{h.emoji}</Text>
                <Text style={s.hTemp}>{h.temp}°</Text>
                {h.rainProb > 0 && <Text style={s.hRain}>{h.rainProb}%</Text>}
              </View>
            ))}
          </ScrollView>
        </GCard>
      )}

      {data.forecast?.length > 0 && (
        <GCard title="7-Day Forecast" emoji="📅">
          {data.forecast.map((d, i) => (
            <View key={i} style={[s.fRow, i < data.forecast.length - 1 && s.fBorder]}>
              <Text style={s.fDay}>{i === 0 ? 'Today' : d.dayName}</Text>
              <Text style={s.fEmoji}>{d.emoji}</Text>
              <Text style={s.fDesc} numberOfLines={1}>{d.desc}</Text>
              <Text style={s.fTemps}>{d.minTemp}° / {d.maxTemp}°</Text>
            </View>
          ))}
        </GCard>
      )}

      {data.forecast?.[0] && (
        <GCard title="Sun & UV" emoji="🌅">
          <View style={s.sunRow}>
            {[
              ['Sunrise', data.forecast[0].sunrise],
              ['Sunset',  data.forecast[0].sunset],
              ['UV',      String(data.forecast[0].uvIndex?.toFixed(1) ?? '--')],
            ].map(([l, v], i) => [
              i > 0 && <View key={'d' + i} style={s.sunDiv}/>,
              <View key={l} style={s.sunItem}>
                <Text style={s.sunLbl}>{l}</Text>
                <Text style={s.sunVal}>{v}</Text>
              </View>,
            ])}
          </View>
        </GCard>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  dimTxt:  { color: C.dim, fontSize: 14 },
  aiTxt:   { fontSize: 14, color: C.txt, lineHeight: 21 },
  // Big weather card — amber glow like Flashlight bg_on
  bigWx:   { backgroundColor: C.surf, borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: C.bdr, overflow: 'hidden' },
  bigGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: C.accDim, opacity: 0.6 },
  bigTop:  { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  bigEmoji:{ fontSize: 52 },
  bigTemp: { fontSize: 48, fontWeight: '800', color: C.acc, lineHeight: 54 },
  bigDesc: { fontSize: 16, color: C.sub },
  bigCity: { fontSize: 12, color: C.dim, marginTop: 2 },
  bigFeels:{ fontSize: 13, color: C.sub },
  // Cards — exact Flashlight card_bg
  card:    { backgroundColor: C.surf, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: C.bdr, overflow: 'hidden' },
  cardHdr: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingTop: 13, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.bdr },
  cardEmoji: { fontSize: 15 },
  cardTitle: { fontSize: 11, fontWeight: '700', color: C.dim, textTransform: 'uppercase', letterSpacing: 1.2 },
  cardBody:  { padding: 15 },
  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCell:  { width: (W - 72) / 2, backgroundColor: C.surfhi, borderRadius: 12, padding: 13, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.bdr },
  statIcon:  { fontSize: 22 },
  statVal:   { fontSize: 17, fontWeight: '700', color: C.acc },
  statLbl:   { fontSize: 11, color: C.dim },
  // Hourly
  hItem:  { alignItems: 'center', marginRight: 18, minWidth: 50 },
  hTime:  { fontSize: 11, color: C.dim, marginBottom: 5 },
  hEmoji: { fontSize: 20, marginBottom: 3 },
  hTemp:  { fontSize: 14, fontWeight: '700', color: C.txt },
  hRain:  { fontSize: 10, color: C.blue, marginTop: 1 },
  // Forecast
  fRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  fBorder: { borderBottomWidth: 1, borderBottomColor: C.bdr },
  fDay:    { width: 48, fontSize: 13, fontWeight: '600', color: C.txt },
  fEmoji:  { fontSize: 18, width: 28, textAlign: 'center' },
  fDesc:   { flex: 1, fontSize: 12, color: C.sub },
  fTemps:  { fontSize: 13, fontWeight: '600', color: C.acc },
  // Sun
  sunRow:  { flexDirection: 'row', alignItems: 'center' },
  sunItem: { flex: 1, alignItems: 'center', gap: 5 },
  sunLbl:  { fontSize: 11, color: C.dim },
  sunVal:  { fontSize: 17, fontWeight: '700', color: C.acc },
  sunDiv:  { width: 1, height: 36, backgroundColor: C.bdr },
});
