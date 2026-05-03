// src/components/NowBarStatusBanner.js
// Flashlight theme: amber accent on dark bg
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import Bridge from '../services/NativeNotificationBridge';

const C = {
  bg:      '#0A0A0A',
  surf:    '#141414',
  bdr:     '#222222',
  acc:     '#FBBF24',   // amber_400
  accDim:  '#2A1800',
  txt:     '#FFFFFF',
  sub:     '#AAAAAA',
  dim:     '#888888',
  ok:      '#22C55E',
  okDim:   '#0A1F0A',
};

export default function NowBarStatusBanner() {
  const [android16, setAndroid16] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    Bridge.canPostPromotedNotifications().then(v => setAndroid16(v));
  }, []);

  if (dismissed) return null;

  return (
    <View style={[s.banner, android16 ? s.bannerOk : s.bannerAmber]}>
      <View style={s.row}>
        <Text style={s.icon}>{android16 ? '✅' : '🔔'}</Text>
        <View style={s.textWrap}>
          <Text style={s.title}>
            {android16 ? 'Android 16 Live Updates active' : 'Samsung Now Bar ready'}
          </Text>
          <Text style={s.sub}>
            {android16
              ? 'Notifications appear in the promoted ongoing area.'
              : 'Enable "Live notifications for all apps" in Developer options to see the Now Bar chip.'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setDismissed(true)} style={s.close}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>
      {!android16 && (
        <TouchableOpacity style={s.devBtn} onPress={() => Linking.openSettings()}>
          <Text style={s.devBtnTxt}>Open Developer Options →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  banner:      { borderRadius: 14, padding: 14, marginBottom: 4, borderWidth: 1 },
  bannerAmber: { backgroundColor: C.accDim, borderColor: '#3A2000' },
  bannerOk:    { backgroundColor: C.okDim,  borderColor: '#166534' },
  row:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  icon:        { fontSize: 18, marginTop: 1 },
  textWrap:    { flex: 1 },
  title:       { fontSize: 13, fontWeight: '700', color: C.txt },
  sub:         { fontSize: 12, color: C.sub, marginTop: 3, lineHeight: 16 },
  close:       { padding: 2 },
  closeTxt:    { fontSize: 13, color: C.dim },
  devBtn:      { marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#1E1200', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14, borderWidth: 1, borderColor: '#3A2000' },
  devBtnTxt:   { fontSize: 12, color: C.acc, fontWeight: '700' },
});
