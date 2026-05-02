import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import {getNewsForCategory} from '../services/geminiService';

interface NewsItem {
  title: string;
  summary: string;
  category: string;
  readTime: string;
  sentiment: string;
  emoji: string;
}

const CATEGORIES = [
  {id: 'technology', label: 'Tech', emoji: '💻', color: '#60efff'},
  {id: 'world', label: 'World', emoji: '🌍', color: '#f093fb'},
  {id: 'science', label: 'Science', emoji: '🔬', color: '#4ade80'},
  {id: 'business', label: 'Business', emoji: '💼', color: '#fbbf24'},
  {id: 'health', label: 'Health', emoji: '💚', color: '#34d399'},
  {id: 'sports', label: 'Sports', emoji: '⚽', color: '#f97316'},
  {id: 'entertainment', label: 'Entertainment', emoji: '🎬', color: '#e879f9'},
  {id: 'india', label: 'India', emoji: '🇮🇳', color: '#fb923c'},
];

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#4ade80',
  negative: '#f87171',
  neutral: '#94a3b8',
};

export default function NewsScreen() {
  const [activeCategory, setActiveCategory] = useState('technology');
  const [news, setNews] = useState<Record<string, NewsItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCategory(activeCategory);
  }, []);

  const loadCategory = async (cat: string) => {
    if (news[cat]) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = await getNewsForCategory(cat);
      setNews(prev => ({...prev, [cat]: items}));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const switchCategory = (cat: string) => {
    setActiveCategory(cat);
    setExpandedCard(null);
    Animated.sequence([
      Animated.timing(slideAnim, {toValue: 20, duration: 100, useNativeDriver: true}),
      Animated.timing(slideAnim, {toValue: 0, duration: 200, useNativeDriver: true}),
    ]).start();
    loadCategory(cat);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setNews(prev => ({...prev, [activeCategory]: []}));
    loadCategory(activeCategory);
  }, [activeCategory]);

  const catInfo = CATEGORIES.find(c => c.id === activeCategory);
  const currentNews = news[activeCategory] || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📰 News Brief</Text>
        <Text style={styles.headerSub}>AI-curated · {new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</Text>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catScrollContent}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catTab, activeCategory === cat.id && [styles.catTabActive, {borderColor: cat.color}]]}
            onPress={() => switchCategory(cat.id)}>
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={[styles.catLabel, activeCategory === cat.id && {color: cat.color}]}>
              {cat.label}
            </Text>
            {activeCategory === cat.id && (
              <View style={[styles.catDot, {backgroundColor: cat.color}]} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Active Category Header */}
      <View style={[styles.catHeader, {borderLeftColor: catInfo?.color}]}>
        <Text style={styles.catHeaderEmoji}>{catInfo?.emoji}</Text>
        <View>
          <Text style={styles.catHeaderTitle}>{catInfo?.label} News</Text>
          <Text style={styles.catHeaderSub}>AI-generated • {currentNews.length} stories</Text>
        </View>
        {loading && <ActivityIndicator size="small" color={catInfo?.color} style={{marginLeft: 'auto'}} />}
      </View>

      {/* News List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60efff" />}
        showsVerticalScrollIndicator={false}>

        {loading && currentNews.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={catInfo?.color || '#60efff'} />
            <Text style={[styles.loadingText, {color: catInfo?.color}]}>
              Fetching {catInfo?.label} news...
            </Text>
            <Text style={styles.loadingSubText}>Powered by Gemini AI</Text>
          </View>
        ) : (
          <Animated.View style={{transform: [{translateY: slideAnim}]}}>
            {currentNews.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.newsCard}
                onPress={() => setExpandedCard(expandedCard === i ? null : i)}
                activeOpacity={0.8}>
                <View style={styles.newsCardTop}>
                  <View style={styles.newsEmojiBox}>
                    <Text style={styles.newsEmoji}>{item.emoji}</Text>
                  </View>
                  <View style={styles.newsMeta}>
                    <View style={[styles.sentimentDot, {backgroundColor: SENTIMENT_COLORS[item.sentiment] || '#94a3b8'}]} />
                    <Text style={styles.newsReadTime}>{item.readTime}</Text>
                    <Text style={styles.newsCat}>{item.category}</Text>
                  </View>
                </View>
                <Text style={styles.newsTitle}>{item.title}</Text>
                {expandedCard === i && (
                  <Animated.View style={styles.newsExpanded}>
                    <View style={styles.newsDivider} />
                    <Text style={styles.newsSummary}>{item.summary}</Text>
                    <View style={styles.newsActions}>
                      <TouchableOpacity style={styles.newsAction}>
                        <Text style={styles.newsActionText}>📖 Read more</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.newsAction}>
                        <Text style={styles.newsActionText}>🔗 Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.newsAction}>
                        <Text style={styles.newsActionText}>🔖 Save</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                )}
                <View style={styles.newsExpandHint}>
                  <Text style={styles.expandHintText}>{expandedCard === i ? '▲ collapse' : '▼ read more'}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {currentNews.length > 0 && (
              <View style={styles.aiBanner}>
                <Text style={styles.aiBannerText}>🤖 Stories generated by Gemini AI</Text>
                <Text style={styles.aiBannerSub}>For real news, connect to a news API</Text>
              </View>
            )}
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0a0f'},
  header: {paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1e1e2e'},
  headerTitle: {color: '#fff', fontSize: 24, fontWeight: '700'},
  headerSub: {color: '#555', fontSize: 13, marginTop: 2},
  catScroll: {maxHeight: 80},
  catScrollContent: {paddingHorizontal: 16, paddingVertical: 12, gap: 8},
  catTab: {alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#1e1e2e', flexDirection: 'row', gap: 6, position: 'relative'},
  catTabActive: {backgroundColor: '#1a1a2e'},
  catEmoji: {fontSize: 16},
  catLabel: {color: '#888', fontSize: 13, fontWeight: '600'},
  catDot: {width: 6, height: 6, borderRadius: 3, marginLeft: 2},
  catHeader: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12, borderLeftWidth: 3, borderLeftColor: '#60efff', backgroundColor: '#0d0d14', marginHorizontal: 16, borderRadius: 12, marginBottom: 4},
  catHeaderEmoji: {fontSize: 24},
  catHeaderTitle: {color: '#fff', fontSize: 15, fontWeight: '700'},
  catHeaderSub: {color: '#555', fontSize: 12, marginTop: 1},
  scroll: {flex: 1},
  scrollContent: {padding: 16, paddingTop: 8, gap: 10},
  loadingState: {alignItems: 'center', paddingTop: 60, gap: 14},
  loadingText: {fontSize: 17, fontWeight: '600'},
  loadingSubText: {color: '#444', fontSize: 13},
  newsCard: {backgroundColor: '#12121a', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#1e1e2e'},
  newsCardTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10},
  newsEmojiBox: {width: 44, height: 44, backgroundColor: '#1e1e2e', borderRadius: 12, justifyContent: 'center', alignItems: 'center'},
  newsEmoji: {fontSize: 22},
  newsMeta: {flexDirection: 'row', alignItems: 'center', gap: 8},
  sentimentDot: {width: 8, height: 8, borderRadius: 4},
  newsReadTime: {color: '#555', fontSize: 11},
  newsCat: {color: '#60efff', fontSize: 11, fontWeight: '600', backgroundColor: '#60efff15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6},
  newsTitle: {color: '#e0e0ff', fontSize: 15, fontWeight: '700', lineHeight: 22},
  newsExpanded: {marginTop: 10},
  newsDivider: {height: 1, backgroundColor: '#1e1e2e', marginBottom: 12},
  newsSummary: {color: '#999', fontSize: 14, lineHeight: 22},
  newsActions: {flexDirection: 'row', gap: 8, marginTop: 14},
  newsAction: {backgroundColor: '#1e1e2e', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10},
  newsActionText: {color: '#ccc', fontSize: 12, fontWeight: '600'},
  newsExpandHint: {alignItems: 'flex-end', marginTop: 8},
  expandHintText: {color: '#444', fontSize: 11},
  aiBanner: {backgroundColor: '#0d1117', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1e1e2e', marginTop: 8},
  aiBannerText: {color: '#60efff', fontSize: 13, fontWeight: '600'},
  aiBannerSub: {color: '#555', fontSize: 11, marginTop: 4},
  bottomSpacer: {height: 100},
});
