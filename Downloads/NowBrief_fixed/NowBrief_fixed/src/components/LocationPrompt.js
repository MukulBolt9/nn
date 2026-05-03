// src/components/LocationPrompt.js
// Theme: Flashlight — dark bg, amber accent
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { GeminiService } from '../services/GeminiService';
import { WeatherService } from '../services/WeatherService';

const C = { bg: '#0A0A0A', surf: '#141414', bdr: '#222222', acc: '#FBBF24', txt: '#FFFFFF', sub: '#AAAAAA', dim: '#888888' };

export default function LocationPrompt({ onLocationSet }) {
  const [city,    setCity]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSet = async () => {
    const name = city.trim();
    if (!name) { setError('Please enter a city name'); return; }
    setLoading(true); setError('');
    try {
      const loc = await GeminiService.resolveLocation(name);
      WeatherService.setLocation(loc.lat, loc.lon, loc.city, loc.country);
      await WeatherService.saveLocation(loc);
      onLocationSet(loc);
    } catch {
      setError('Could not find location. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const useSalboni = async () => {
    const loc = { lat: 22.2967, lon: 87.0788, city: 'Salboni', country: 'India' };
    WeatherService.setLocation(loc.lat, loc.lon, loc.city, loc.country);
    await WeatherService.saveLocation(loc);
    onLocationSet(loc);
  };

  return (
    <View style={s.wrap}>
      <Text style={s.emoji}>📍</Text>
      <Text style={s.title}>Where are you?</Text>
      <Text style={s.sub}>Enter your city for accurate weather and your personalized brief.</Text>
      <TextInput
        style={s.input}
        value={city}
        onChangeText={setCity}
        placeholder="e.g. Kolkata, Mumbai, Salboni…"
        placeholderTextColor={C.dim}
        onSubmitEditing={handleSet}
        returnKeyType="done"
        autoFocus
      />
      {!!error && <Text style={s.err}>{error}</Text>}
      <TouchableOpacity style={s.btn} onPress={handleSet} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color={C.bg}/> : <Text style={s.btnTxt}>Set Location</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={useSalboni} style={s.default}>
        <Text style={s.defaultTxt}>Use Salboni (default)</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji:      { fontSize: 52, marginBottom: 16 },
  title:      { fontSize: 22, fontWeight: '800', color: C.txt, marginBottom: 8 },
  sub:        { fontSize: 14, color: C.sub, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  input:      { width: '100%', backgroundColor: C.surf, borderRadius: 14, padding: 16, fontSize: 16, color: C.txt, borderWidth: 1, borderColor: C.bdr, marginBottom: 8 },
  err:        { color: '#EF4444', fontSize: 13, marginBottom: 8 },
  btn:        { width: '100%', backgroundColor: C.acc, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  btnTxt:     { color: C.bg, fontSize: 16, fontWeight: '700' },
  default:    { padding: 8 },
  defaultTxt: { color: C.dim, fontSize: 14, textDecorationLine: 'underline' },
});
