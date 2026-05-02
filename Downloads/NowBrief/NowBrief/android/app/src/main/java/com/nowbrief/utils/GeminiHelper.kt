package com.nowbrief.utils

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*

object GeminiHelper {

    private const val TAG = "GeminiHelper"
    private const val GEMINI_API_KEY = "AIzaSyC356BnpkkFlWyIclsX5aB1OMvY-uNW0Hk"
    private const val GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GEMINI_API_KEY"

    suspend fun getDailyBrief(context: Context, weatherSummary: String): String {
        return withContext(Dispatchers.IO) {
            try {
                val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
                val timeOfDay = when {
                    hour in 5..11 -> "morning"
                    hour in 12..17 -> "afternoon"
                    else -> "evening"
                }
                val date = SimpleDateFormat("EEEE, MMMM d", Locale.getDefault()).format(Date())

                val prompt = """
                    You are NowBrief, a smart personal assistant. Create a very short, warm, helpful $timeOfDay brief.
                    Current weather info: $weatherSummary
                    Date: $date
                    
                    Provide a JSON response with exactly this structure:
                    {
                      "greeting": "Short warm greeting (max 12 words)",
                      "weatherTip": "Weather-based tip or advice (max 15 words)",
                      "motivationalQuote": "Brief motivational quote or tip (max 15 words)",
                      "musicMood": "Suggested music mood for this time (max 8 words)",
                      "quickTip": "One useful daily life tip (max 15 words)",
                      "energyLevel": "morning/afternoon/evening energy advice (max 12 words)"
                    }
                    
                    Only return JSON, no markdown, no explanation.
                """.trimIndent()

                val response = callGeminiAPI(prompt)
                Log.d(TAG, "Gemini response: $response")
                response
            } catch (e: Exception) {
                Log.e(TAG, "Gemini error: ${e.message}")
                """{"greeting":"Have a wonderful day!","weatherTip":"Stay comfortable today","motivationalQuote":"Every day is a new opportunity","musicMood":"Feel-good upbeat vibes","quickTip":"Stay hydrated throughout the day","energyLevel":"Keep a steady pace today"}"""
            }
        }
    }

    suspend fun getNewsSummary(category: String): String {
        return withContext(Dispatchers.IO) {
            try {
                val prompt = """
                    You are a news summarizer. Create 5 realistic, helpful news headlines for the "$category" category.
                    Format as JSON array:
                    [
                      {
                        "title": "News headline (max 12 words)",
                        "summary": "Two sentence summary",
                        "category": "$category",
                        "readTime": "2 min read",
                        "sentiment": "positive/neutral/negative",
                        "emoji": "relevant emoji"
                      }
                    ]
                    Make headlines realistic, informative, and diverse. Only return JSON array.
                """.trimIndent()

                callGeminiAPI(prompt)
            } catch (e: Exception) {
                Log.e(TAG, "News summary error: ${e.message}")
                "[]"
            }
        }
    }

    suspend fun getMusicRecommendations(mood: String, weather: String): String {
        return withContext(Dispatchers.IO) {
            try {
                val prompt = """
                    Recommend 4 songs/playlists for someone feeling "$mood" with this weather: "$weather".
                    Return JSON array:
                    [
                      {
                        "title": "Song or playlist name",
                        "artist": "Artist name",
                        "mood": "$mood",
                        "genre": "Music genre",
                        "emoji": "🎵",
                        "thumbnailColor": "#hex color matching the vibe",
                        "duration": "3:45"
                      }
                    ]
                    Only return JSON array.
                """.trimIndent()

                callGeminiAPI(prompt)
            } catch (e: Exception) {
                "[]"
            }
        }
    }

    suspend fun getWeatherInsights(weatherData: String): String {
        return withContext(Dispatchers.IO) {
            try {
                val prompt = """
                    Analyze this weather data and provide helpful insights: "$weatherData"
                    Return JSON:
                    {
                      "whatToWear": "Clothing advice (max 20 words)",
                      "activitySuggestion": "Best activity for this weather (max 15 words)",  
                      "healthTip": "Weather-related health tip (max 15 words)",
                      "travelAdvice": "Travel/commute tip (max 15 words)",
                      "moodBooster": "Positive spin on the weather (max 12 words)"
                    }
                    Only return JSON.
                """.trimIndent()

                callGeminiAPI(prompt)
            } catch (e: Exception) {
                """{"whatToWear":"Dress comfortably for the day","activitySuggestion":"A great day for a walk","healthTip":"Stay hydrated throughout the day","travelAdvice":"Allow extra time for your commute","moodBooster":"Every weather has its own charm"}"""
            }
        }
    }

    private fun callGeminiAPI(prompt: String): String {
        val url = URL(GEMINI_URL)
        val connection = url.openConnection() as HttpURLConnection
        connection.apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")
            doOutput = true
            connectTimeout = 15000
            readTimeout = 15000
        }

        val requestBody = JSONObject().apply {
            put("contents", JSONArray().apply {
                put(JSONObject().apply {
                    put("parts", JSONArray().apply {
                        put(JSONObject().apply {
                            put("text", prompt)
                        })
                    })
                })
            })
            put("generationConfig", JSONObject().apply {
                put("temperature", 0.7)
                put("maxOutputTokens", 1000)
            })
        }.toString()

        connection.outputStream.use { it.write(requestBody.toByteArray()) }

        val responseCode = connection.responseCode
        val reader = if (responseCode == HttpURLConnection.HTTP_OK) {
            BufferedReader(InputStreamReader(connection.inputStream))
        } else {
            BufferedReader(InputStreamReader(connection.errorStream))
        }

        val response = reader.readText()
        reader.close()
        connection.disconnect()

        if (responseCode != HttpURLConnection.HTTP_OK) {
            throw Exception("API Error $responseCode: $response")
        }

        // Extract text from Gemini response
        val jsonResponse = JSONObject(response)
        val candidates = jsonResponse.getJSONArray("candidates")
        val firstCandidate = candidates.getJSONObject(0)
        val content = firstCandidate.getJSONObject("content")
        val parts = content.getJSONArray("parts")
        return parts.getJSONObject(0).getString("text")
            .replace("```json", "")
            .replace("```", "")
            .trim()
    }
}
