import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StatusBar, Platform, NativeModules, PermissionsAndroid} from 'react-native';
import SummaryScreen from './src/screens/SummaryScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import NewsScreen from './src/screens/NewsScreen';
import TabBar from './src/components/TabBar';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    requestPermissions();
    startNowBriefService();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        ]);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const startNowBriefService = () => {
    if (Platform.OS === 'android') {
      try {
        NativeModules.NowBriefModule?.startService();
      } catch (e) {
        console.log('Service start via module failed, using intent');
      }
    }
  };

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Tab.Navigator
        tabBar={props => <TabBar {...props} />}
        screenOptions={{headerShown: false}}>
        <Tab.Screen name="Summary" component={SummaryScreen} />
        <Tab.Screen name="Weather" component={WeatherScreen} />
        <Tab.Screen name="News" component={NewsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
