import React, {useRef, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

const TAB_CONFIG = [
  {name: 'Summary', icon: '✨', activeIcon: '✨', label: 'Brief'},
  {name: 'Weather', icon: '🌤️', activeIcon: '🌤️', label: 'Weather'},
  {name: 'News', icon: '📰', activeIcon: '📰', label: 'News'},
];

export default function TabBar({state, descriptors, navigation}: any) {
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabWidth = (width - 32) / TAB_CONFIG.length;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      tension: 180,
      friction: 12,
    }).start();
  }, [state.index]);

  return (
    <View style={styles.container}>
      {/* Glowing indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {width: tabWidth - 16, transform: [{translateX: Animated.add(indicatorAnim, new Animated.Value(8))}]},
        ]}
      />

      {TAB_CONFIG.map((tab, i) => {
        const isFocused = state.index === i;
        const scaleAnim = useRef(new Animated.Value(1)).current;

        const onPress = () => {
          Animated.sequence([
            Animated.timing(scaleAnim, {toValue: 0.85, duration: 80, useNativeDriver: true}),
            Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true}),
          ]).start();

          const event = navigation.emit({type: 'tabPress', target: state.routes[i].key, canPreventDefault: true});
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(state.routes[i].name);
          }
        };

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}>
            <Animated.View style={[styles.tabInner, {transform: [{scale: scaleAnim}]}]}>
              <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
                {isFocused ? tab.activeIcon : tab.icon}
              </Text>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#0e0e18',
    borderTopWidth: 1,
    borderTopColor: '#1e1e2e',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 6,
    height: 3,
    backgroundColor: '#60efff',
    borderRadius: 2,
    shadowColor: '#60efff',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  tabInner: {alignItems: 'center', gap: 4},
  tabIcon: {fontSize: 22, opacity: 0.4},
  tabIconActive: {opacity: 1},
  tabLabel: {color: '#444', fontSize: 11, fontWeight: '600'},
  tabLabelActive: {color: '#60efff'},
});
