import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  ActivityIndicator, Dimensions, TouchableOpacity,
} from 'react-native';
import {fetchWeather, WeatherData} from '../services/weatherService';
import {getWeatherInsights} from '../services/geminiService';

const {width} = Dimensions.get('window');

interface WeatherInsights {
  whatToWear: string;
  activitySuggestion: string;
  healthTip: string;
  travelAdvice: string;
  moodBooster: string;
}

const WEATHER_BG: Record<string, string> = {
  clear: '#1a1a2e',
  cloud: '#12121a',
  rain: '#0d1117',
  snow: '#0f1923',
  thunder: '#1a0d2e',
  fog: '#12181e',
};

function getWeatherBg(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('clear') || c.includes('sun')) return WEATHER_BG.clear;
  if (c.includes('cloud')) return WEATHER_BG.cloud;
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return WEATHER_BG.rain;
  if (c.includes('snow')) return WEATHER_BG.snow;
  if (c.includes('thunder') || c.includes('storm')) return WEATHER_BG.thunder;
  if (c.includes('fog')) return WEATHER_BG.fog;
  return WEATHER_BG.cloud;
}

function StatBox({icon, label, value, unit, color}: any) {
  return (
    <View style={[styles.statBox, {borderColor: color + '44'}]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}<Text style={styles.statUnit}>{unit}</Text></Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function WeatherScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [insights, setInsights] = useState<WeatherInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {loadData();}, []);

  const loadData = async () => {
    try {
      const w = await fetchWeather();
      setWeather(w);
      const ins = await getWeatherInsights(w.summary);
      setInsights(ins);
    } catch (e) {console.error(e);}
    finally {setLoading(false); setRefreshing(false);}
  };

  const onRefresh = useCallback(() => {setRefreshing(true); loadData();}, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#60efff" />
        <Text style={styles.loadingText}>Fetching weather data...</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>Unable to load weather</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bg = getWeatherBg(weather.condition);

  return (
    <View style={[styles.container, {backgroundColor: bg}]}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{weather.emoji}</Text>
        <Text style={styles.heroTemp}>{weather.temperature}°</Text>
        <Text style={styles.heroCond}>{weather.condition}</Text>
        <Text style={styles.heroFeels}>Feels like {weather.feelsLike}°C</Text>
        <View style={styles.heroTimeline}>
          <Text style={styles.heroSun}>🌅 {weather.sunrise}</Text>
          <View style={styles.heroSunBar} />
          <Text style={styles.heroSun}>🌇 {weather.sunset}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60efff" />}
        showsVerticalScrollIndicator={false}>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatBox icon="💧" label="Humidity" value={weather.humidity} unit="%" color="#60efff" />
          <StatBox icon="🌬️" label="Wind" value={weather.windSpeed} unit="km/h" color="#a78bfa" />
          <StatBox icon="🌧️" label="Rain" value={weather.precipProbability} unit="%" color="#60a5fa" />
          <StatBox icon="🌡️" label="Min/Max" value={`${weather.forecast[0]?.minTemp}/${weather.forecast[0]?.maxTemp}`} unit="°C" color="#fb923c" />
        </View>

        {/* 7-Day Forecast */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 7-Day Forecast</Text>
          {weather.forecast.slice(0, 7).map((day, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.forecastRow, i === selectedDay && styles.forecastRowActive]}
              onPress={() => setSelectedDay(i)}>
              <Text style={styles.forecastDay}>{day.day}</Text>
              <Text style={styles.forecastEmoji}>{day.emoji}</Text>
              <Text style={styles.forecastCond}>{day.condition}</Text>
              <View style={styles.forecastTemps}>
                <Text style={styles.forecastMax}>{day.maxTemp}°</Text>
                <Text style={styles.forecastSep}>/</Text>
                <Text style={styles.forecastMin}>{day.minTemp}°</Text>
              </View>
              {day.precipProbability > 10 && (
                <Text style={styles.forecastRain}>💧{day.precipProbability}%</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Insights */}
        {insights && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>🤖 AI Weather Insights</Text>
              <Text style={styles.geminiTag}>Gemini</Text>
            </View>
            <InsightRow emoji="👕" label="What to wear" value={insights.whatToWear} />
            <InsightRow emoji="🏃" label="Activity" value={insights.activitySuggestion} />
            <InsightRow emoji="💚" label="Health tip" value={insights.healthTip} />
            <InsightRow emoji="🚗" label="Travel" value={insights.travelAdvice} />
            <InsightRow emoji="😊" label="Mood boost" value={insights.moodBooster} isLast />
          </View>
        )}

        {/* Rain Probability Bar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌧️ Precipitation Chance</Text>
          {weather.forecast.slice(0, 7).map((day, i) => (
            <View key={i} style={styles.precipRow}>
              <Text style={styles.precipDay}>{day.day.slice(0, 3)}</Text>
              <View style={styles.precipBarBg}>
                <View style={[styles.precipBar, {
                  width: `${day.precipProbability}%`,
                  backgroundColor: day.precipProbability > 60 ? '#60a5fa' : day.precipProbability > 30 ? '#93c5fd' : '#1e3a5f',
                }]} />
              </View>
              <Text style={styles.precipPct}>{day.precipProbability}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function InsightRow({emoji, label, value, isLast}: any) {
  return (
    <View style={[styles.insightRow, !isLast && styles.insightRowBorder]}>
      <Text style={styles.insightEmoji}>{emoji}</Text>
      <View style={styles.insightText}>
        <Text style={styles.insightLabel}>{label}</Text>
        <Text style={styles.insightValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  loading: {flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', gap: 16},
  loadingText: {color: '#60efff', fontSize: 16},
  errorEmoji: {fontSize: 40},
  errorText: {color: '#fff', fontSize: 18},
  retryBtn: {backgroundColor: '#60efff', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20},
  retryText: {color: '#000', fontWeight: '700'},
  hero: {paddingTop: 70, paddingBottom: 28, alignItems: 'center'},
  heroEmoji: {fontSize: 72},
  heroTemp: {color: '#fff', fontSize: 80, fontWeight: '100', letterSpacing: -4, lineHeight: 88},
  heroCond: {color: 'rgba(255,255,255,0.9)', fontSize: 22, fontWeight: '500'},
  heroFeels: {color: 'rgba(255,255,255,0.6)', fontSize: 15, marginTop: 4},
  heroTimeline: {flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12},
  heroSun: {color: 'rgba(255,255,255,0.7)', fontSize: 14},
  heroSunBar: {flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', maxWidth: 80, borderRadius: 1},
  scroll: {flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#0a0a0f', overflow: 'hidden'},
  scrollContent: {padding: 16, paddingTop: 20, gap: 12},
  statsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  statBox: {width: (width - 52) / 2, backgroundColor: '#12121a', borderRadius: 16, padding: 16, borderWidth: 1},
  statIcon: {fontSize: 24, marginBottom: 8},
  statValue: {color: '#fff', fontSize: 22, fontWeight: '700'},
  statUnit: {fontSize: 14, fontWeight: '400', color: '#888'},
  statLabel: {color: '#666', fontSize: 12, marginTop: 4},
  card: {backgroundColor: '#12121a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#1e1e2e'},
  cardTitle: {color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 14},
  cardTitleRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8},
  geminiTag: {color: '#60efff', fontSize: 11, fontWeight: '700', backgroundColor: '#60efff22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8},
  forecastRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, borderRadius: 12, paddingHorizontal: 8},
  forecastRowActive: {backgroundColor: '#1e1e40'},
  forecastDay: {color: '#888', fontSize: 13, fontWeight: '600', width: 68},
  forecastEmoji: {fontSize: 20},
  forecastCond: {color: '#ccc', fontSize: 13, flex: 1},
  forecastTemps: {flexDirection: 'row', alignItems: 'center'},
  forecastMax: {color: '#fff', fontSize: 15, fontWeight: '700'},
  forecastSep: {color: '#444', fontSize: 13, marginHorizontal: 2},
  forecastMin: {color: '#555', fontSize: 13},
  forecastRain: {color: '#60a5fa', fontSize: 11},
  insightRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, gap: 12},
  insightRowBorder: {borderBottomWidth: 1, borderBottomColor: '#1e1e2e'},
  insightEmoji: {fontSize: 20, marginTop: 1},
  insightText: {flex: 1},
  insightLabel: {color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4},
  insightValue: {color: '#ccc', fontSize: 14, lineHeight: 20},
  precipRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10},
  precipDay: {color: '#888', fontSize: 12, width: 30},
  precipBarBg: {flex: 1, height: 8, backgroundColor: '#1e1e2e', borderRadius: 4, overflow: 'hidden'},
  precipBar: {height: '100%', borderRadius: 4},
  precipPct: {color: '#ccc', fontSize: 12, width: 35, textAlign: 'right'},
  bottomSpacer: {height: 100},
});
