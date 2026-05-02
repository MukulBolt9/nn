import {PermissionsAndroid, Platform} from 'react-native';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  emoji: string;
  humidity: number;
  windSpeed: number;
  precipProbability: number;
  sunrise: string;
  sunset: string;
  forecast: DayForecast[];
  summary: string;
}

export interface DayForecast {
  day: string;
  emoji: string;
  condition: string;
  maxTemp: number;
  minTemp: number;
  precipProbability: number;
}

const WMO_CODES: Record<number, [string, string]> = {
  0: ['☀️', 'Clear sky'], 1: ['🌤️', 'Mainly clear'], 2: ['⛅', 'Partly cloudy'],
  3: ['☁️', 'Overcast'], 45: ['🌫️', 'Foggy'], 48: ['🌫️', 'Icy fog'],
  51: ['🌦️', 'Light drizzle'], 53: ['🌦️', 'Drizzle'], 55: ['🌧️', 'Heavy drizzle'],
  61: ['🌧️', 'Slight rain'], 63: ['🌧️', 'Moderate rain'], 65: ['🌧️', 'Heavy rain'],
  71: ['❄️', 'Slight snow'], 73: ['❄️', 'Moderate snow'], 75: ['❄️', 'Heavy snow'],
  80: ['⛈️', 'Rain showers'], 81: ['⛈️', 'Moderate showers'], 82: ['⛈️', 'Violent showers'],
  95: ['⛈️', 'Thunderstorm'], 96: ['⛈️', 'Hail storm'], 99: ['⛈️', 'Heavy thunderstorm'],
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function getLocation(): Promise<{lat: number; lon: number}> {
  // Default: Howrah, West Bengal
  const defaultLocation = {lat: 22.5958, lon: 88.2636};

  if (Platform.OS !== 'android') return defaultLocation;

  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    );
    if (!granted) return defaultLocation;

    return new Promise(resolve => {
      // Use a timeout to avoid hanging
      const timeout = setTimeout(() => resolve(defaultLocation), 5000);
      try {
        // @ts-ignore
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => {
              clearTimeout(timeout);
              resolve({lat: pos.coords.latitude, lon: pos.coords.longitude});
            },
            () => {
              clearTimeout(timeout);
              resolve(defaultLocation);
            },
            {timeout: 4000, maximumAge: 60000},
          );
        } else {
          clearTimeout(timeout);
          resolve(defaultLocation);
        }
      } catch {
        clearTimeout(timeout);
        resolve(defaultLocation);
      }
    });
  } catch {
    return defaultLocation;
  }
}

export async function fetchWeather(): Promise<WeatherData> {
  const {lat, lon} = await getLocation();

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` +
    `&timezone=auto&forecast_days=7`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather fetch failed');
  const data = await response.json();

  const current = data.current;
  const daily = data.daily;
  const weatherCode = current.weather_code;
  const [emoji, condition] = WMO_CODES[weatherCode] || ['🌡️', 'Unknown'];

  const forecast: DayForecast[] = [];
  for (let i = 0; i < Math.min(7, daily.time.length); i++) {
    const date = new Date(daily.time[i]);
    const dayCode = daily.weather_code[i];
    const [dayEmoji, dayCondition] = WMO_CODES[dayCode] || ['🌡️', 'Unknown'];
    forecast.push({
      day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[date.getDay()],
      emoji: dayEmoji,
      condition: dayCondition,
      maxTemp: Math.round(daily.temperature_2m_max[i]),
      minTemp: Math.round(daily.temperature_2m_min[i]),
      precipProbability: daily.precipitation_probability_max[i] || 0,
    });
  }

  const temp = Math.round(current.temperature_2m);
  const summary = `${emoji} ${condition} · ${temp}°C` +
    (current.precipitation_probability > 30 ? ` · 🌧️ ${current.precipitation_probability}% rain` : '');

  return {
    temperature: temp,
    feelsLike: Math.round(current.apparent_temperature),
    condition,
    emoji,
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    precipProbability: current.precipitation_probability || 0,
    sunrise: daily.sunrise[0].split('T')[1]?.substring(0, 5) || '6:00',
    sunset: daily.sunset[0].split('T')[1]?.substring(0, 5) || '18:00',
    forecast,
    summary,
  };
}
