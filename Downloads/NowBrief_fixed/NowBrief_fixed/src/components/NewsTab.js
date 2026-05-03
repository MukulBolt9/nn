// src/components/NewsTab.js
// Theme: Flashlight amber_400 #FBBF24, bg #0A0A0A, card #141414
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { NewsService, NEWS_CATEGORIES } from '../services/NewsService';
import { GeminiService } from '../services/GeminiService';

const C = {
  bg:   '#0A0A0A', surf: '#141414', surfhi: '#1E1E1E',
  bdr:  '#222222', acc:  '#FBBF24', accDim: '#2A1800',
  txt:  '#FFFFFF', sub:  '#AAAAAA', dim: '#888888',
  blue: '#60A5FA', cyan: '#22D3EE', red: '#F87171',
};

// Accent colours for news cards — warm palette matching amber theme
const ACCS = [C.acc, '#F97316', '#FB923C', '#FBBF24', '#FCD34D', '#FDE68A'];

function NewsCard({ article, accent }) {
  const [expanded, setExpanded] = useState(false);
  const [summary,  setSummary]  = useState('');

  const toggle = async () => {
    if (!expanded && !summary) {
      const s = await GeminiService.summarizeArticle(article).catch(() => article.description || '');
      setSummary(s);
    }
    setExpanded(e => !e);
  };

  return (
    <TouchableOpacity
      style={s.newsCard}
      onPress={toggle}
      onLongPress={() => article.url && Linking.openURL(article.url)}
      activeOpacity={0.85}>
      {/* Amber accent bar — like Flashlight intensity bar */}
      <View style={[s.newsBar, { backgroundColor: accent }]}/>
      <View style={s.newsInner}>
        <View style={s.newsMeta}>
          <Text style={[s.newsSrc, { color: accent }]}>{article.source}</Text>
          <Text style={s.newsDot}>·</Text>
          <Text style={s.newsTime}>{NewsService.timeAgo(article.publishedAt)}</Text>
          <Text style={[s.newsExp, { marginLeft: 'auto' }]}>{expanded ? '▲' : '▼'}</Text>
        </View>
        <Text style={s.newsTitle} numberOfLines={expanded ? 0 : 2}>{article.title}</Text>
        {expanded && (
          <View style={s.newsExpanded}>
            {summary
              ? <Text style={s.newsSumTxt}>{summary}</Text>
              : <ActivityIndicator size="small" color={C.acc} style={{ alignSelf: 'flex-start' }}/>
            }
            {article.url
              ? <TouchableOpacity onPress={() => Linking.openURL(article.url)} style={s.readMore}>
                  <Text style={s.readMoreTxt}>Read full article →</Text>
                </TouchableOpacity>
              : null
            }
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function NewsTab({ data, isLoading }) {
  const [cat, setCat] = useState('general');
  const articles = (data && data[cat]) || [];

  return (
    <View style={s.root}>
      {/* Category chips — Flashlight seekbar bg style */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catScroll}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
        {NEWS_CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[s.chip, cat === c.id && s.chipActive]}
            onPress={() => setCat(c.id)}
            activeOpacity={0.8}>
            <Text style={s.chipEmoji}>{c.emoji}</Text>
            <Text style={[s.chipLbl, cat === c.id && s.chipLblActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {isLoading && !articles.length
          ? <View style={s.center}><ActivityIndicator color={C.acc}/></View>
          : !articles.length
            ? <View style={s.center}><Text style={s.dimTxt}>No articles. Pull to refresh.</Text></View>
            : articles.map((a, i) => <NewsCard key={i} article={a} accent={ACCS[i % ACCS.length]}/>)
        }
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  catScroll: { marginBottom: 12 },
  center:    { alignItems: 'center', paddingTop: 60 },
  dimTxt:    { color: '#888888', fontSize: 14 },
  // Chip — Flashlight-style dark with amber active
  chip:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, gap: 5, borderWidth: 1, borderColor: '#222222' },
  chipActive: { backgroundColor: '#FBBF24', borderColor: '#FBBF24' },
  chipEmoji:  { fontSize: 13 },
  chipLbl:    { fontSize: 12, fontWeight: '600', color: '#888888' },
  chipLblActive: { color: '#0A0A0A' },
  // News card — exact Flashlight card pattern
  newsCard:  { flexDirection: 'row', backgroundColor: '#141414', borderRadius: 14, marginBottom: 9, overflow: 'hidden', borderWidth: 1, borderColor: '#222222' },
  newsBar:   { width: 3 },
  newsInner: { flex: 1, padding: 13 },
  newsMeta:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  newsSrc:   { fontSize: 11, fontWeight: '700' },
  newsDot:   { fontSize: 11, color: '#888888' },
  newsTime:  { fontSize: 11, color: '#888888' },
  newsExp:   { fontSize: 10, color: '#888888' },
  newsTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', lineHeight: 20 },
  newsExpanded: { marginTop: 9 },
  newsSumTxt:   { fontSize: 13, color: '#AAAAAA', lineHeight: 19 },
  readMore:     { marginTop: 9, alignSelf: 'flex-start', backgroundColor: '#2A1800', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#3A2000' },
  readMoreTxt:  { fontSize: 12, color: '#FBBF24', fontWeight: '600' },
});
