import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated, Easing, Dimensions,
} from 'react-native';
import {fetchWeather, WeatherData} from '../services/weatherService';
import {getDailySummary, getMusicRecs} from '../services/geminiService';

const {width} = Dimensions.get('window');

interface Summary {
  greeting: string;
  weatherTip: string;
  motivationalQuote: string;
  musicMood: string;
  quickTip: string;
  energyLevel: string;
}

interface MusicRec {
  title: string;
  artist: string;
  genre: string;
  emoji: string;
  thumbnailColor: string;
  duration: string;
}

const GRADIENT_COLORS_BY_HOUR = () => {
  const h = new Date().getHours();
  if (h < 6) return ['#0f0c29', '#302b63', '#24243e'];
  if (h < 10) return ['#f093fb', '#f5576c', '#4facfe'];
  if (h < 14) return ['#0061ff', '#60efff', '#0096c7'];
  if (h < 18) return ['#f7971e', '#ffd200', '#f7971e'];
  if (h < 21) return ['#ee0979', '#ff6a00', '#9b59b6'];
  return ['#141e30', '#243b55', '#141e30'];
};

function AnimatedCard({children, delay = 0, style}: any) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 500, delay, useNativeDriver: true}),
      Animated.timing(translateY, {toValue: 0, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{opacity, transform: [{translateY}]}, style]}>
      {children}
    </Animated.View>
  );
}

export default function SummaryScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [music, setMusic] = useState<MusicRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const greetingOpacity = React.useRef(new Animated.Value(1)).current;

  const greetings = [
    '👋 Good day!', '🌟 Stay amazing!', '💫 You got this!',
    '🎯 Focus up!', '🌈 Spread joy!', '⚡ Stay energized!',
  ];

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(greetingOpacity, {toValue: 0, duration: 300, useNativeDriver: true}),
        Animated.timing(greetingOpacity, {toValue: 1, duration: 300, useNativeDriver: true}),
      ]).start();
      setGreetingIndex(i => (i + 1) % greetings.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const w = await fetchWeather();
      setWeather(w);
      const [s, m] = await Promise.all([
        getDailySummary(w.summary),
        getMusicRecs(w.condition, w.summary),
      ]);
      setSummary(s);
      setMusic(m);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const gradColors = GRADIENT_COLORS_BY_HOUR();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingInner}>
          <ActivityIndicator size="large" color="#60efff" />
          <Text style={styles.loadingText}>Preparing your brief...</Text>
          <Text style={styles.loadingSubText}>Fetching weather & AI insights</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <View style={[styles.header, {backgroundColor: gradColors[0]}]}>
        <View style={styles.headerTop}>
          <View>
            <Animated.Text style={[styles.headerGreeting, {opacity: greetingOpacity}]}>
              {greetings[greetingIndex]}
            </Animated.Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>NowBrief</Text>
          </View>
        </View>

        {/* Weather Quick View */}
        {weather && (
          <View style={styles.headerWeather}>
            <Text style={styles.headerTemp}>{weather.emoji} {weather.temperature}°C</Text>
            <Text style={styles.headerCond}>{weather.condition}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60efff" />}
        showsVerticalScrollIndicator={false}>

        {/* AI Summary Card */}
        {summary && (
          <AnimatedCard delay={100}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🤖</Text>
                <Text style={styles.cardTitle}>AI Brief</Text>
                <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>Gemini</Text></View>
              </View>
              <Text style={styles.aiGreeting}>{summary.greeting}</Text>
              <View style={styles.divider} />
              <View style={styles.summaryGrid}>
                <SummaryItem icon="🌤️" label="Weather" value={summary.weatherTip} color="#60efff" />
                <SummaryItem icon="💡" label="Tip" value={summary.quickTip} color="#f093fb" />
                <SummaryItem icon="⚡" label="Energy" value={summary.energyLevel} color="#ffd200" />
                <SummaryItem icon="🌟" label="Thought" value={summary.motivationalQuote} color="#4ade80" />
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* Weather Advice Banner */}
        {weather && summary && (
          <AnimatedCard delay={200}>
            <View style={[styles.card, styles.weatherBanner]}>
              <Text style={styles.weatherBannerEmoji}>{weather.emoji}</Text>
              <View style={styles.weatherBannerText}>
                <Text style={styles.weatherBannerTitle}>{weather.condition}</Text>
                <Text style={styles.weatherBannerSub}>{summary.weatherTip}</Text>
              </View>
              <View style={styles.weatherBannerStats}>
                <Text style={styles.weatherStat}>💧 {weather.humidity}%</Text>
                <Text style={styles.weatherStat}>🌬️ {weather.windSpeed}km/h</Text>
                {weather.precipProbability > 20 && (
                  <Text style={styles.weatherStat}>🌧️ {weather.precipProbability}%</Text>
                )}
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* Music Recommendations */}
        <AnimatedCard delay={300}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🎵</Text>
              <Text style={styles.cardTitle}>Music for your mood</Text>
              {summary && <Text style={styles.musicMoodTag}>{summary.musicMood}</Text>}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.musicScroll}>
              {music.map((track, i) => (
                <TouchableOpacity key={i} style={[styles.musicCard, {backgroundColor: track.thumbnailColor + '33'}]}>
                  <View style={[styles.musicThumbnail, {backgroundColor: track.thumbnailColor}]}>
                    <Text style={styles.musicEmoji}>{track.emoji}</Text>
                  </View>
                  <Text style={styles.musicTitle} numberOfLines={2}>{track.title}</Text>
                  <Text style={styles.musicArtist} numberOfLines={1}>{track.artist}</Text>
                  <View style={styles.musicMeta}>
                    <Text style={styles.musicGenre}>{track.genre}</Text>
                    <Text style={styles.musicDuration}>{track.duration}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </AnimatedCard>

        {/* 7-Day Forecast Mini */}
        {weather && (
          <AnimatedCard delay={400}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📅</Text>
                <Text style={styles.cardTitle}>7-Day Forecast</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {weather.forecast.slice(0, 7).map((day, i) => (
                  <View key={i} style={[styles.forecastDay, i === 0 && styles.forecastDayActive]}>
                    <Text style={styles.forecastDayLabel}>{day.day}</Text>
                    <Text style={styles.forecastEmoji}>{day.emoji}</Text>
                    <Text style={styles.forecastMax}>{day.maxTemp}°</Text>
                    <Text style={styles.forecastMin}>{day.minTemp}°</Text>
                    {day.precipProbability > 20 && (
                      <Text style={styles.forecastRain}>🌧️{day.precipProbability}%</Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </AnimatedCard>
        )}

        {/* Quick Tips */}
        {summary && (
          <AnimatedCard delay={500}>
            <View style={[styles.card, styles.tipsCard]}>
              <Text style={styles.tipsTitle}>💫 Daily Wisdom</Text>
              <Text style={styles.tipsQuote}>"{summary.motivationalQuote}"</Text>
            </View>
          </AnimatedCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function SummaryItem({icon, label, value, color}: any) {
  return (
    <View style={styles.summaryItem}>
      <View style={[styles.summaryItemIcon, {backgroundColor: color + '22'}]}>
        <Text style={styles.summaryItemEmoji}>{icon}</Text>
      </View>
      <Text style={styles.summaryItemLabel}>{label}</Text>
      <Text style={styles.summaryItemValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0a0f'},
  loadingContainer: {flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center'},
  loadingInner: {alignItems: 'center', gap: 16},
  loadingText: {color: '#60efff', fontSize: 18, fontWeight: '600', marginTop: 16},
  loadingSubText: {color: '#666', fontSize: 14},
  header: {paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20},
  headerTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16},
  headerGreeting: {color: '#fff', fontSize: 24, fontWeight: '700', letterSpacing: -0.5},
  headerDate: {color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4},
  headerBadge: {backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20},
  headerBadgeText: {color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1},
  headerWeather: {flexDirection: 'row', alignItems: 'center', gap: 12},
  headerTemp: {color: '#fff', fontSize: 32, fontWeight: '300'},
  headerCond: {color: 'rgba(255,255,255,0.8)', fontSize: 16},
  scroll: {flex: 1},
  scrollContent: {padding: 16, gap: 12},
  card: {backgroundColor: '#12121a', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#1e1e2e'},
  cardHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8},
  cardIcon: {fontSize: 20},
  cardTitle: {color: '#fff', fontSize: 16, fontWeight: '700', flex: 1},
  aiBadge: {backgroundColor: '#60efff22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10},
  aiBadgeText: {color: '#60efff', fontSize: 11, fontWeight: '700'},
  aiGreeting: {color: '#e0e0ff', fontSize: 18, fontWeight: '600', lineHeight: 26, marginBottom: 14},
  divider: {height: 1, backgroundColor: '#1e1e2e', marginBottom: 14},
  summaryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  summaryItem: {width: (width - 68) / 2, backgroundColor: '#0a0a0f', borderRadius: 14, padding: 12},
  summaryItemIcon: {width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8},
  summaryItemEmoji: {fontSize: 18},
  summaryItemLabel: {color: '#666', fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5},
  summaryItemValue: {color: '#ccc', fontSize: 13, lineHeight: 18},
  weatherBanner: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0d1117'},
  weatherBannerEmoji: {fontSize: 40},
  weatherBannerText: {flex: 1},
  weatherBannerTitle: {color: '#fff', fontSize: 16, fontWeight: '700'},
  weatherBannerSub: {color: '#999', fontSize: 13, marginTop: 4},
  weatherBannerStats: {gap: 4, alignItems: 'flex-end'},
  weatherStat: {color: '#60efff', fontSize: 12, fontWeight: '600'},
  musicMoodTag: {color: '#f093fb', fontSize: 12, fontWeight: '600'},
  musicScroll: {marginHorizontal: -4},
  musicCard: {width: 130, marginHorizontal: 4, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#1e1e2e'},
  musicThumbnail: {width: '100%', aspectRatio: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10},
  musicEmoji: {fontSize: 32},
  musicTitle: {color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 18},
  musicArtist: {color: '#888', fontSize: 11, marginTop: 2},
  musicMeta: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 6},
  musicGenre: {color: '#60efff', fontSize: 10, fontWeight: '600'},
  musicDuration: {color: '#555', fontSize: 10},
  forecastDay: {alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, marginRight: 4, borderRadius: 14, backgroundColor: '#0a0a0f', minWidth: 72},
  forecastDayActive: {backgroundColor: '#1e1e40', borderWidth: 1, borderColor: '#60efff44'},
  forecastDayLabel: {color: '#888', fontSize: 11, fontWeight: '600', marginBottom: 6},
  forecastEmoji: {fontSize: 22, marginBottom: 4},
  forecastMax: {color: '#fff', fontSize: 15, fontWeight: '700'},
  forecastMin: {color: '#555', fontSize: 12},
  forecastRain: {color: '#60a5fa', fontSize: 10, marginTop: 2},
  tipsCard: {backgroundColor: '#0d1117', borderColor: '#f093fb33'},
  tipsTitle: {color: '#f093fb', fontSize: 14, fontWeight: '700', marginBottom: 10},
  tipsQuote: {color: '#e0e0ff', fontSize: 17, fontStyle: 'italic', lineHeight: 26},
  bottomSpacer: {height: 100},
});
