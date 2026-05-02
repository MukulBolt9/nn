package com.nowbrief.utils

import android.content.Context
import android.location.LocationManager
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

object WeatherHelper {

    private const val TAG = "WeatherHelper"
    // Open-Meteo: free, no API key needed
    private const val WEATHER_BASE_URL = "https://api.open-meteo.com/v1/forecast"

    // WMO weather condition codes
    private val WMO_CODES = mapOf(
        0 to Pair("☀️", "Clear sky"),
        1 to Pair("🌤️", "Mainly clear"),
        2 to Pair("⛅", "Partly cloudy"),
        3 to Pair("☁️", "Overcast"),
        45 to Pair("🌫️", "Foggy"),
        48 to Pair("🌫️", "Icy fog"),
        51 to Pair("🌦️", "Light drizzle"),
        53 to Pair("🌦️", "Moderate drizzle"),
        55 to Pair("🌧️", "Dense drizzle"),
        61 to Pair("🌧️", "Slight rain"),
        63 to Pair("🌧️", "Moderate rain"),
        65 to Pair("🌧️", "Heavy rain"),
        71 to Pair("❄️", "Slight snow"),
        73 to Pair("❄️", "Moderate snow"),
        75 to Pair("❄️", "Heavy snow"),
        80 to Pair("⛈️", "Rain showers"),
        81 to Pair("⛈️", "Moderate showers"),
        82 to Pair("⛈️", "Violent showers"),
        95 to Pair("⛈️", "Thunderstorm"),
        96 to Pair("⛈️", "Thunderstorm with hail"),
        99 to Pair("⛈️", "Heavy thunderstorm")
    )

    suspend fun getWeatherSummary(context: Context): String {
        return withContext(Dispatchers.IO) {
            try {
                val (lat, lon) = getApproximateLocation(context)
                val weatherData = fetchWeather(lat, lon)
                parseWeatherSummary(weatherData)
            } catch (e: Exception) {
                Log.e(TAG, "Weather fetch error: ${e.message}")
                "🌤️ Weather data unavailable"
            }
        }
    }

    suspend fun getFullWeatherData(context: Context): WeatherData? {
        return withContext(Dispatchers.IO) {
            try {
                val (lat, lon) = getApproximateLocation(context)
                val weatherData = fetchWeather(lat, lon)
                parseFullWeather(weatherData)
            } catch (e: Exception) {
                Log.e(TAG, "Full weather error: ${e.message}")
                null
            }
        }
    }

    private fun getApproximateLocation(context: Context): Pair<Double, Double> {
        // Try to get last known location
        try {
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val providers = locationManager.getProviders(true)
            for (provider in providers) {
                try {
                    @Suppress("MissingPermission")
                    val location = locationManager.getLastKnownLocation(provider)
                    if (location != null) {
                        return Pair(location.latitude, location.longitude)
                    }
                } catch (e: Exception) { /* skip */ }
            }
        } catch (e: Exception) { /* skip */ }

        // Default: Howrah, West Bengal, India (user's location)
        return Pair(22.5958, 88.2636)
    }

    private fun fetchWeather(lat: Double, lon: Double): JSONObject {
        val urlStr = "$WEATHER_BASE_URL?latitude=$lat&longitude=$lon" +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability" +
            "&hourly=temperature_2m,precipitation_probability,weather_code" +
            "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset" +
            "&timezone=auto&forecast_days=3"

        val url = URL(urlStr)
        val connection = url.openConnection() as HttpURLConnection
        connection.apply {
            requestMethod = "GET"
            connectTimeout = 10000
            readTimeout = 10000
        }

        val reader = BufferedReader(InputStreamReader(connection.inputStream))
        val response = reader.readText()
        reader.close()
        connection.disconnect()

        return JSONObject(response)
    }

    private fun parseWeatherSummary(data: JSONObject): String {
        val current = data.getJSONObject("current")
        val temp = current.getDouble("temperature_2m").toInt()
        val weatherCode = current.getInt("weather_code")
        val humidity = current.getInt("relative_humidity_2m")
        val windSpeed = current.getDouble("wind_speed_10m").toInt()
        val precipProb = current.optInt("precipitation_probability", 0)

        val (emoji, condition) = WMO_CODES[weatherCode] ?: Pair("🌡️", "Unknown")

        return "$emoji $condition · ${temp}°C · 💧${humidity}% · 🌬️${windSpeed}km/h" +
            if (precipProb > 30) " · 🌧️${precipProb}% rain" else ""
    }

    private fun parseFullWeather(data: JSONObject): WeatherData {
        val current = data.getJSONObject("current")
        val daily = data.getJSONObject("daily")
        val hourly = data.getJSONObject("hourly")

        val weatherCode = current.getInt("weather_code")
        val (emoji, condition) = WMO_CODES[weatherCode] ?: Pair("🌡️", "Unknown")

        val maxTemps = daily.getJSONArray("temperature_2m_max")
        val minTemps = daily.getJSONArray("temperature_2m_min")
        val dailyCodes = daily.getJSONArray("weather_code")
        val dailyPrecip = daily.getJSONArray("precipitation_probability_max")

        val forecast = mutableListOf<DayForecast>()
        for (i in 0 until minOf(3, maxTemps.length())) {
            val dayCode = dailyCodes.getInt(i)
            val (dayEmoji, dayCondition) = WMO_CODES[dayCode] ?: Pair("🌡️", "Unknown")
            forecast.add(DayForecast(
                emoji = dayEmoji,
                condition = dayCondition,
                maxTemp = maxTemps.getDouble(i).toInt(),
                minTemp = minTemps.getDouble(i).toInt(),
                precipProbability = dailyPrecip.getInt(i)
            ))
        }

        return WeatherData(
            temperature = current.getDouble("temperature_2m").toInt(),
            feelsLike = current.getDouble("apparent_temperature").toInt(),
            condition = condition,
            emoji = emoji,
            humidity = current.getInt("relative_humidity_2m"),
            windSpeed = current.getDouble("wind_speed_10m").toInt(),
            precipProbability = current.optInt("precipitation_probability", 0),
            sunrise = daily.getJSONArray("sunrise").getString(0).takeLast(5),
            sunset = daily.getJSONArray("sunset").getString(0).takeLast(5),
            forecast = forecast,
            weatherCode = weatherCode
        )
    }

    data class WeatherData(
        val temperature: Int,
        val feelsLike: Int,
        val condition: String,
        val emoji: String,
        val humidity: Int,
        val windSpeed: Int,
        val precipProbability: Int,
        val sunrise: String,
        val sunset: String,
        val forecast: List<DayForecast>,
        val weatherCode: Int
    )

    data class DayForecast(
        val emoji: String,
        val condition: String,
        val maxTemp: Int,
        val minTemp: Int,
        val precipProbability: Int
    )
}
